-- ════════════════════════════════════════════════════════════════
-- JM TECH — TANDA 4: POS / PUNTO DE VENTA
-- Migración 0004 — Extiende `sales` para ventas reales (vendedor, descuento,
-- estado/anulación, NCF, garantía), añade `sale_payments` (pago mixto), y dos
-- funciones de base que ejecutan el cobro y la anulación de forma ATÓMICA en el
-- servidor (validan stock y rol, descuentan/reponen stock). La UI nunca decide
-- el stock: lo hace la base.
--
-- `sales` y `sale_items` ya existen (0002) con RLS+FORCE; reusamos.
-- ════════════════════════════════════════════════════════════════

-- ── Extender sales ───────────────────────────────────────────────
alter table public.sales
  add column if not exists seller_id          uuid references public.app_users (id),
  add column if not exists discount           numeric(12,2) not null default 0 check (discount >= 0),
  add column if not exists status             text not null default 'completada',
  add column if not exists voided_at          timestamptz,
  add column if not exists void_reason        text,
  add column if not exists voided_by          uuid references public.app_users (id),
  add column if not exists ncf                text,
  add column if not exists ncf_type           text,
  add column if not exists generates_warranty boolean not null default false;

do $$ begin
  alter table public.sales add constraint sales_status_chk
    check (status in ('completada','anulada'));
exception when duplicate_object then null; end $$;

-- Ampliar métodos válidos (incluye débito/crédito/mixto para el POS).
alter table public.sales drop constraint if exists sales_payment_method_check;
alter table public.sales add constraint sales_payment_method_check
  check (payment_method in ('efectivo','tarjeta','transferencia','debito','credito','mixto'));

create index if not exists sales_status_idx on public.sales (status);
create index if not exists sales_seller_idx on public.sales (seller_id);

-- Secuencia para NCF simulado.
create sequence if not exists public.ncf_seq start 1;

-- ── sale_payments (pago mixto) ───────────────────────────────────
create table if not exists public.sale_payments (
  id         uuid primary key default gen_random_uuid(),
  sale_id    uuid not null references public.sales (id) on delete cascade,
  method     text not null check (method in ('efectivo','transferencia','debito','credito')),
  amount     numeric(12,2) not null check (amount >= 0),  -- monto aplicado (RD$)
  tendered   numeric(12,2),                                -- recibido (efectivo)
  reference  text,                                         -- voucher/ref (simulado)
  created_at timestamptz not null default now()
);
create index if not exists sale_payments_sale_idx on public.sale_payments (sale_id);

alter table public.sale_payments enable row level security;
alter table public.sale_payments force  row level security;

drop policy if exists sale_payments_read on public.sale_payments;
create policy sale_payments_read on public.sale_payments
  for select to authenticated using (true);

drop policy if exists sale_payments_admin_write on public.sale_payments;
create policy sale_payments_admin_write on public.sale_payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- FUNCIÓN: pos_checkout — cobro atómico.
-- Valida rol y stock (con lock), recalcula precios desde la BD (la UI no
-- decide montos), registra venta + líneas + pagos y descuenta stock.
-- SECURITY DEFINER con verificación interna de rol y search_path fijo.
-- ════════════════════════════════════════════════════════════════
create or replace function public.pos_checkout(
  p_profile            profile_type,
  p_customer           uuid,
  p_items              jsonb,   -- [{product_id, qty}]
  p_payments           jsonb,   -- [{method, amount, tendered?, reference?}]
  p_discount           numeric default 0,
  p_generates_warranty boolean default false,
  p_fiscal             boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_seller   uuid;
  v_role     app_role;
  v_item     jsonb;
  v_pay      jsonb;
  v_pid      uuid;
  v_qty      integer;
  v_price    numeric;
  v_stock    integer;
  v_gross    numeric := 0;
  v_disc     numeric := greatest(0, coalesce(p_discount, 0));
  v_total    numeric;
  v_subtotal numeric;
  v_itbis    numeric;
  v_paid     numeric := 0;
  v_tendered numeric := 0;
  v_method   text;
  v_sale     uuid;
  v_ncf      text;
  v_ncf_type text;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select id, role into v_seller, v_role from app_users where auth_id = v_uid;
  if v_seller is null or v_role not in ('owner','admin') then
    raise exception 'No autorizado para cobrar';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  -- Validar stock y acumular bruto (lock de fila para evitar descuadres).
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::integer;
    if v_qty is null or v_qty <= 0 then raise exception 'Cantidad inválida'; end if;
    select price, stock into v_price, v_stock from products
      where id = v_pid and profile_type = p_profile and active = true
      for update;
    if v_price is null then raise exception 'Producto no disponible en este perfil'; end if;
    if v_stock < v_qty then
      raise exception 'Stock insuficiente (quedan % unidades)', v_stock;
    end if;
    v_gross := v_gross + v_price * v_qty;
  end loop;

  v_disc     := least(v_disc, v_gross);
  v_total    := round(v_gross - v_disc, 2);
  v_subtotal := round(v_total / 1.18, 2);   -- precios con ITBIS incluido
  v_itbis    := round(v_total - v_subtotal, 2);

  -- Validar que los pagos cubren el total.
  if p_payments is null or jsonb_array_length(p_payments) = 0 then
    raise exception 'Falta el pago';
  end if;
  for v_pay in select * from jsonb_array_elements(p_payments) loop
    v_paid     := v_paid + coalesce((v_pay->>'amount')::numeric, 0);
    v_tendered := v_tendered + coalesce(nullif(v_pay->>'tendered','')::numeric,
                                        (v_pay->>'amount')::numeric, 0);
  end loop;
  if v_paid < v_total - 0.5 then
    raise exception 'El pago no cubre el total';
  end if;

  if jsonb_array_length(p_payments) > 1 then v_method := 'mixto';
  else v_method := (p_payments->0->>'method'); end if;

  v_ncf_type := case when p_fiscal then 'B01' else 'B02' end;
  v_ncf := v_ncf_type || lpad(nextval('public.ncf_seq')::text, 8, '0');

  insert into sales (profile_type, customer_id, seller_id, subtotal, itbis, total,
                     discount, payment_method, status, generates_warranty,
                     ncf, ncf_type, sold_at)
  values (p_profile, p_customer, v_seller, v_subtotal, v_itbis, v_total,
          v_disc, v_method, 'completada', coalesce(p_generates_warranty, false),
          v_ncf, v_ncf_type, now())
  returning id into v_sale;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::integer;
    select price into v_price from products where id = v_pid;
    insert into sale_items (sale_id, product_id, qty, unit_price, line_total)
      values (v_sale, v_pid, v_qty, v_price, v_price * v_qty);
    update products set stock = stock - v_qty where id = v_pid;
  end loop;

  for v_pay in select * from jsonb_array_elements(p_payments) loop
    insert into sale_payments (sale_id, method, amount, tendered, reference)
      values (v_sale, v_pay->>'method', (v_pay->>'amount')::numeric,
              nullif(v_pay->>'tendered','')::numeric,
              nullif(v_pay->>'reference',''));
  end loop;

  return jsonb_build_object(
    'sale_id', v_sale, 'ncf', v_ncf, 'ncf_type', v_ncf_type,
    'subtotal', v_subtotal, 'itbis', v_itbis, 'discount', v_disc,
    'total', v_total, 'paid', v_paid, 'change', greatest(0, round(v_tendered - v_total, 2))
  );
end $$;

-- ════════════════════════════════════════════════════════════════
-- FUNCIÓN: pos_void_sale — anulación atómica (repone stock, no borra).
-- ════════════════════════════════════════════════════════════════
create or replace function public.pos_void_sale(p_sale uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_voider uuid;
  v_role   app_role;
  v_status text;
  v_item   record;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select id, role into v_voider, v_role from app_users where auth_id = v_uid;
  if v_voider is null or v_role not in ('owner','admin') then
    raise exception 'No autorizado para anular';
  end if;
  select status into v_status from sales where id = p_sale for update;
  if v_status is null then raise exception 'La venta no existe'; end if;
  if v_status = 'anulada' then raise exception 'La venta ya está anulada'; end if;

  -- Reponer stock de cada línea.
  for v_item in select product_id, qty from sale_items where sale_id = p_sale loop
    if v_item.product_id is not null then
      update products set stock = stock + v_item.qty where id = v_item.product_id;
    end if;
  end loop;

  update sales set status = 'anulada', voided_at = now(),
                   void_reason = nullif(trim(p_reason), ''), voided_by = v_voider
  where id = p_sale;

  return jsonb_build_object('sale_id', p_sale, 'status', 'anulada');
end $$;

-- Solo usuarios autenticados pueden invocar las funciones (el rol se valida
-- adentro). Nada para anon.
revoke all on function public.pos_checkout(profile_type, uuid, jsonb, jsonb, numeric, boolean, boolean) from public, anon;
grant execute on function public.pos_checkout(profile_type, uuid, jsonb, jsonb, numeric, boolean, boolean) to authenticated;
revoke all on function public.pos_void_sale(uuid, text) from public, anon;
grant execute on function public.pos_void_sale(uuid, text) to authenticated;
