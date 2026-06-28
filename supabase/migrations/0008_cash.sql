-- ════════════════════════════════════════════════════════════════
-- JM TECH — TANDA 7: CAJA SEPARADA POR PERFIL
-- Migración 0008 — Cada perfil es una TIENDA INDEPENDIENTE: su propia caja,
-- apertura, egresos, cierre y arqueo. Nunca se mezclan. La caja lee las ventas
-- de SU perfil dentro de la ventana de la sesión (organismo, sin re-teclear).
-- Cálculos y cuadre en el SERVIDOR (funciones SECURITY DEFINER). RLS + FORCE.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.cash_registers (
  id             uuid primary key default gen_random_uuid(),
  profile_type   profile_type not null,
  status         text not null default 'abierta' check (status in ('abierta','cerrada')),
  opening_amount numeric(12,2) not null default 0 check (opening_amount >= 0),
  opened_by      uuid references public.app_users (id),
  opened_at      timestamptz not null default now(),
  closed_by      uuid references public.app_users (id),
  closed_at      timestamptz,
  counted_cash   numeric(12,2),
  expected_cash  numeric(12,2),
  difference     numeric(12,2),
  summary        jsonb,            -- foto del resumen al cerrar
  notes          text,
  created_at     timestamptz not null default now()
);
-- Solo UNA caja abierta por perfil a la vez.
create unique index if not exists cash_one_open_per_profile
  on public.cash_registers (profile_type) where status = 'abierta';
create index if not exists cash_registers_profile_idx on public.cash_registers (profile_type, status);

create table if not exists public.cash_movements (
  id           uuid primary key default gen_random_uuid(),
  register_id  uuid not null references public.cash_registers (id) on delete cascade,
  profile_type profile_type not null,
  kind         text not null default 'egreso' check (kind in ('egreso','ingreso')),
  amount       numeric(12,2) not null check (amount >= 0),
  reason       text,
  category     text,
  created_by   uuid references public.app_users (id),
  created_at   timestamptz not null default now()
);
create index if not exists cash_movements_reg_idx on public.cash_movements (register_id);

-- ── RLS + FORCE ──────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['cash_registers','cash_movements']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force  row level security;', t);
    execute format($p$
      drop policy if exists %1$s_read on public.%1$s;
      create policy %1$s_read on public.%1$s for select to authenticated using (true);
    $p$, t);
    execute format($p$
      drop policy if exists %1$s_admin_write on public.%1$s;
      create policy %1$s_admin_write on public.%1$s for all to authenticated
        using (public.is_admin()) with check (public.is_admin());
    $p$, t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════
-- FUNCIÓN: cash_summary — resumen calculado en el servidor.
-- Lee las ventas del PERFIL de la caja dentro de su ventana (apertura → cierre
-- o ahora), no anuladas; desglosa por método (vía sale_payments); resta egresos.
-- ════════════════════════════════════════════════════════════════
create or replace function public.cash_summary(p_register uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
  if auth.uid() is null then raise exception 'No autenticado'; end if;
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
end $$;

-- ── Helper de autorización local ─────────────────────────────────
create or replace function public.cash_actor()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_role app_role;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  select id, role into v_id, v_role from app_users where auth_id = auth.uid();
  if v_id is null or v_role not in ('owner','admin') then
    raise exception 'No autorizado para operar la caja';
  end if;
  return v_id;
end $$;

-- ── Abrir caja ───────────────────────────────────────────────────
create or replace function public.cash_open(p_profile profile_type, p_opening numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_actor uuid; v_id uuid;
begin
  v_actor := cash_actor();
  if exists (select 1 from cash_registers where profile_type = p_profile and status = 'abierta') then
    raise exception 'Ya hay una caja abierta para este perfil';
  end if;
  insert into cash_registers (profile_type, status, opening_amount, opened_by)
  values (p_profile, 'abierta', greatest(0, coalesce(p_opening, 0)), v_actor)
  returning id into v_id;
  return jsonb_build_object('register_id', v_id);
end $$;

-- ── Registrar movimiento (egreso / ingreso manual) ───────────────
create or replace function public.cash_movement(
  p_register uuid, p_kind text, p_amount numeric, p_reason text, p_category text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_actor uuid; r cash_registers;
begin
  v_actor := cash_actor();
  select * into r from cash_registers where id = p_register for update;
  if r.id is null then raise exception 'Caja no existe'; end if;
  if r.status <> 'abierta' then raise exception 'La caja está cerrada'; end if;
  if p_kind not in ('egreso','ingreso') then raise exception 'Tipo inválido'; end if;
  if coalesce(p_amount,0) <= 0 then raise exception 'Monto inválido'; end if;
  insert into cash_movements (register_id, profile_type, kind, amount, reason, category, created_by)
  values (p_register, r.profile_type, p_kind, p_amount, nullif(trim(p_reason),''), nullif(trim(p_category),''), v_actor);
  return jsonb_build_object('ok', true);
end $$;

-- ── Cerrar caja con arqueo ───────────────────────────────────────
create or replace function public.cash_close(
  p_register uuid, p_counted numeric, p_notes text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid; r cash_registers; s jsonb;
  v_expected numeric; v_diff numeric;
begin
  v_actor := cash_actor();
  select * into r from cash_registers where id = p_register for update;
  if r.id is null then raise exception 'Caja no existe'; end if;
  if r.status <> 'abierta' then raise exception 'La caja ya está cerrada'; end if;

  s := cash_summary(p_register);
  v_expected := (s->>'expected_cash')::numeric;
  v_diff := round(coalesce(p_counted,0) - v_expected, 2);

  update cash_registers set
    status = 'cerrada',
    closed_by = v_actor,
    closed_at = now(),
    counted_cash = coalesce(p_counted, 0),
    expected_cash = v_expected,
    difference = v_diff,
    summary = s,
    notes = nullif(trim(p_notes), '')
  where id = p_register;

  return jsonb_build_object(
    'expected_cash', v_expected,
    'counted_cash', coalesce(p_counted, 0),
    'difference', v_diff,
    'summary', s
  );
end $$;

-- Solo authenticated puede invocar; el rol se valida adentro. Nada para anon.
do $$
declare f text;
begin
  foreach f in array array[
    'cash_summary(uuid)',
    'cash_open(profile_type, numeric)',
    'cash_movement(uuid, text, numeric, text, text)',
    'cash_close(uuid, numeric, text)'
  ]
  loop
    execute format('revoke all on function public.%s from public, anon;', f);
    execute format('grant execute on function public.%s to authenticated;', f);
  end loop;
end $$;
