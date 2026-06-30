-- ════════════════════════════════════════════════════════════════
-- JM TECH — CIERRE DE ADVERTENCIAS DEL SECURITY ADVISOR DE SUPABASE
-- Migración 0014 — Tres cosas, sin romper el uso legítimo:
--  (1) search_path fijo en las 2 funciones que no lo tenían.
--  (2) Bloquear EXECUTE de `anon` en los helpers SECURITY DEFINER; los helpers
--      de RLS (is_admin/current_app_role/session_active) DEBEN seguir
--      ejecutables por `authenticated` (las políticas los invocan); resolve_actor
--      es puramente interno → se revoca también de authenticated.
--  (3) Las funciones de acción ahora exigen SESIÓN VIGENTE internamente
--      (session_active): una cuenta vencida no puede escribir/leer por RPC
--      aunque la llame directo (las RPC SECURITY DEFINER saltan RLS).
--  La protección de contraseñas filtradas se activa en el panel (acción Marien).
-- ════════════════════════════════════════════════════════════════

-- ── (1) search_path fijo en las funciones de trigger sin él ──────
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.activity_log_immutable()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  raise exception 'El historial de actividad es INVIOLABLE: %.',
    case tg_op when 'DELETE' then 'no se puede borrar ningún registro'
               when 'TRUNCATE' then 'no se puede vaciar el historial'
               else 'no se puede modificar ningún registro' end
    using errcode = 'check_violation';
  return null;
end;
$$;

-- ── (3) Gatekeepers con verificación de SESIÓN VIGENTE ───────────
create or replace function public.cash_actor()
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_role app_role; v_active boolean; v_exp timestamptz;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  select id, role, is_active, access_expires_at into v_id, v_role, v_active, v_exp
    from app_users where auth_id = auth.uid();
  if v_id is null or v_role not in ('owner','admin') then
    raise exception 'No autorizado para operar la caja';
  end if;
  if v_role <> 'owner' and (not v_active or (v_exp is not null and v_exp <= now())) then
    raise exception 'Acceso vencido o inactivo' using errcode = '42501';
  end if;
  return v_id;
end $$;

create or replace function public.employee_actor()
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_role app_role; v_active boolean; v_exp timestamptz;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  select id, role, is_active, access_expires_at into v_id, v_role, v_active, v_exp
    from app_users where auth_id = auth.uid();
  if v_id is null or v_role not in ('owner','admin') then
    raise exception 'No autorizado para gestionar empleados';
  end if;
  if v_role <> 'owner' and (not v_active or (v_exp is not null and v_exp <= now())) then
    raise exception 'Acceso vencido o inactivo' using errcode = '42501';
  end if;
  return v_id;
end $$;

-- ── (3) Funciones de acción con guard session_active() inyectado ─
CREATE OR REPLACE FUNCTION public.cash_summary(p_register uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r          cash_registers;
  v_from     timestamptz;
  v_to       timestamptz;
  v_total    numeric := 0;
  v_count    integer := 0;
  v_efectivo numeric := 0;
  v_transfer numeric := 0;
  v_debito   numeric := 0;
  v_credito  numeric := 0;
  v_egresos  numeric := 0;
  v_ingresos numeric := 0;
  v_expected numeric := 0;
begin
  if not public.session_active() then raise exception 'Acceso vencido o inactivo' using errcode = '42501'; end if;
  select * into r from cash_registers where id = p_register;
  if r.id is null then raise exception 'Caja no existe'; end if;
  v_from := r.opened_at;
  v_to   := coalesce(r.closed_at, now());

  select coalesce(sum(s.total), 0), count(*) into v_total, v_count
  from sales s
  where s.profile_type = r.profile_type and s.status <> 'anulada'
    and s.sold_at >= v_from and s.sold_at <= v_to;

  select
    coalesce(sum(sp.amount) filter (where sp.method = 'efectivo'), 0),
    coalesce(sum(sp.amount) filter (where sp.method = 'transferencia'), 0),
    coalesce(sum(sp.amount) filter (where sp.method = 'debito'), 0),
    coalesce(sum(sp.amount) filter (where sp.method = 'credito'), 0)
  into v_efectivo, v_transfer, v_debito, v_credito
  from sale_payments sp
  join sales s on s.id = sp.sale_id
  where s.profile_type = r.profile_type and s.status <> 'anulada'
    and s.sold_at >= v_from and s.sold_at <= v_to;

  select
    coalesce(sum(amount) filter (where kind = 'egreso'), 0),
    coalesce(sum(amount) filter (where kind = 'ingreso'), 0)
  into v_egresos, v_ingresos
  from cash_movements where register_id = p_register;

  -- Solo el EFECTIVO afecta el conteo físico.
  v_expected := r.opening_amount + v_efectivo + v_ingresos - v_egresos;

  return jsonb_build_object(
    'opening', r.opening_amount,
    'efectivo', v_efectivo, 'transferencia', v_transfer,
    'debito', v_debito, 'credito', v_credito,
    'total_sales', v_total, 'sale_count', v_count,
    'egresos', v_egresos, 'ingresos_manual', v_ingresos,
    'expected_cash', v_expected
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.employee_alerts(p_profile profile_type, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_since timestamptz := now() - make_interval(days => greatest(1, coalesce(p_days,30)));
  v_avg_anul numeric := 0;
  v_result jsonb := '[]'::jsonb;
  r record;
  v_flags jsonb;
begin
  if not public.session_active() then raise exception 'Acceso vencido o inactivo' using errcode = '42501'; end if;

  -- Promedio de anulaciones por empleado activo de la tienda (base de comparación).
  select coalesce(avg(c), 0) into v_avg_anul from (
    select count(*) filter (where l.action_type = 'venta_anulada') c
    from employees e
    left join activity_log l on l.employee_id = e.id and l.created_at >= v_since
    where e.profile_type = p_profile and e.is_active
    group by e.id
  ) t;

  for r in
    select e.id, e.full_name, e.role,
      count(*) filter (where l.action_type = 'venta_anulada')   as anulaciones,
      count(*) filter (where l.action_type = 'venta')           as ventas,
      count(*) filter (where l.action_type = 'precio_cambiado') as precios,
      count(*) filter (where l.action_type = 'descuento_alto')  as descuentos,
      count(*) filter (where l.action_type = 'arqueo_faltante') as faltantes
    from employees e
    left join activity_log l on l.employee_id = e.id and l.created_at >= v_since
    where e.profile_type = p_profile and e.is_active
    group by e.id, e.full_name, e.role
  loop
    v_flags := '[]'::jsonb;

    -- Anulaciones frecuentes: absolutas (>=3) y por encima de 2x el promedio.
    if r.anulaciones >= 3 and (v_avg_anul = 0 or r.anulaciones >= v_avg_anul * 2) then
      v_flags := v_flags || jsonb_build_object(
        'key','anulaciones_frecuentes',
        'label','Anulaciones frecuentes',
        'detail', r.anulaciones || ' anulaciones'
          || case when v_avg_anul > 0 then ' (' || round(r.anulaciones / nullif(v_avg_anul,0), 1) || 'x el promedio de la tienda)' else '' end);
    end if;
    -- Cambios de precio frecuentes.
    if r.precios >= 4 then
      v_flags := v_flags || jsonb_build_object(
        'key','cambios_precio_frecuentes','label','Cambios de precio frecuentes',
        'detail', r.precios || ' cambios de precio en el período');
    end if;
    -- Descuentos altos frecuentes.
    if r.descuentos >= 3 then
      v_flags := v_flags || jsonb_build_object(
        'key','descuentos_altos','label','Descuentos altos frecuentes',
        'detail', r.descuentos || ' descuentos altos aplicados');
    end if;
    -- Faltantes de arqueo recurrentes.
    if r.faltantes >= 2 then
      v_flags := v_flags || jsonb_build_object(
        'key','arqueo_faltante_recurrente','label','Faltantes de arqueo recurrentes',
        'detail', r.faltantes || ' cierres con faltante');
    end if;

    if jsonb_array_length(v_flags) > 0 then
      v_result := v_result || jsonb_build_object(
        'employee_id', r.id, 'name', r.full_name, 'role', r.role,
        'anulaciones', r.anulaciones, 'ventas', r.ventas, 'precios', r.precios,
        'descuentos', r.descuentos, 'faltantes', r.faltantes,
        'flags', v_flags);
    end if;
  end loop;

  return v_result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.pos_checkout(p_profile profile_type, p_customer uuid, p_items jsonb, p_payments jsonb, p_discount numeric DEFAULT 0, p_generates_warranty boolean DEFAULT false, p_fiscal boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  if not public.session_active() then raise exception 'Acceso vencido o inactivo' using errcode = '42501'; end if;
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
end $function$
;

CREATE OR REPLACE FUNCTION public.pos_void_sale(p_sale uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  if not public.session_active() then raise exception 'Acceso vencido o inactivo' using errcode = '42501'; end if;
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
end $function$
;

-- ── (2) Cerrar EXECUTE de anon en helpers; resolve_actor también de authenticated ──
revoke execute on function public.is_admin() from anon, public;
revoke execute on function public.current_app_role() from anon, public;
revoke execute on function public.session_active() from anon, public;
revoke execute on function public.resolve_actor(profile_type, uuid) from anon, authenticated, public;
