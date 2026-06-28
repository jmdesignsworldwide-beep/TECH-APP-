-- ════════════════════════════════════════════════════════════════
-- JM TECH — TANDA 8: EMPLEADOS + HISTORIAL INVIOLABLE + ALERTAS
-- Migración 0009 — El diferenciador de CONTROL del dueño.
--
--   • employees       — plantilla SEPARADA por perfil/tienda (HR real).
--   • employee_private — datos sensibles (salario) con RLS solo admin/owner.
--   • activity_log    — historial INVIOLABLE: solo INSERT. Ni el owner ni el
--                       service_role pueden UPDATE/DELETE (revoke + trigger que
--                       SIEMPRE lanza excepción). Es el corazón del módulo.
--   • Triggers que ALIMENTAN el historial desde el dato real ya existente
--     (ventas, anulaciones, cambios de precio, caja, clientes) — no se reteclea.
--   • employee_alerts — inteligencia calculada sobre el historial inmutable.
--   • Semilla dominicana por tienda + actividad histórica creíble (una alerta viva).
--
-- RLS + FORCE en toda tabla nueva. Funciones SECURITY DEFINER con search_path fijo.
-- ════════════════════════════════════════════════════════════════

-- ── Tipos del dominio ────────────────────────────────────────────
do $$ begin
  create type employee_role as enum ('administrador', 'vendedor', 'cajero');
exception when duplicate_object then null; end $$;

-- ── Tabla: employees (plantilla por tienda/perfil) ───────────────
create table if not exists public.employees (
  id           uuid primary key default gen_random_uuid(),
  profile_type profile_type not null,
  full_name    text not null,
  cedula       text,                         -- 000-0000000-0
  phone        text,                         -- 809/829/849
  role         employee_role not null default 'vendedor',
  username     text,                         -- acceso interno de la tienda
  photo_url    text,
  hired_at     date not null default current_date,
  is_active    boolean not null default true,
  -- Enlace OPCIONAL a una cuenta de login (app_users). Permite atribuir las
  -- acciones en vivo del usuario autenticado al empleado correcto de su tienda.
  app_user_id  uuid references public.app_users (id) on delete set null,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists employees_cedula_key on public.employees (cedula) where cedula is not null;
create index if not exists employees_profile_idx on public.employees (profile_type, is_active);

drop trigger if exists trg_employees_updated on public.employees;
create trigger trg_employees_updated
  before update on public.employees
  for each row execute function public.set_updated_at();

-- ── Tabla: employee_private (salario — privacidad reforzada) ─────
-- Tabla separada para conseguir privacidad a NIVEL COLUMNA con RLS de fila:
-- solo owner/admin pueden SELECT aquí. Los demás roles ni siquiera la leen.
create table if not exists public.employee_private (
  employee_id uuid primary key references public.employees (id) on delete cascade,
  salary      numeric(12,2) check (salary >= 0),
  updated_at  timestamptz not null default now()
);

-- ── Tabla: activity_log (HISTORIAL INVIOLABLE — el corazón) ──────
create table if not exists public.activity_log (
  id           uuid primary key default gen_random_uuid(),
  profile_type profile_type not null,
  employee_id  uuid references public.employees (id) on delete set null,
  actor_name   text not null,                -- foto del nombre (permanente)
  action_type  text not null,                -- 'venta','venta_anulada',...
  entity       text,                         -- 'venta','producto','caja',...
  entity_ref   text,                         -- referencia humana (#123, NCF...)
  detail       text not null,                -- descripción legible del hecho
  amount       numeric(12,2),                -- monto involucrado (si aplica)
  severity     text not null default 'info' check (severity in ('info','warn')),
  meta         jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists activity_log_profile_idx on public.activity_log (profile_type, created_at desc);
create index if not exists activity_log_employee_idx on public.activity_log (employee_id, created_at desc);
create index if not exists activity_log_action_idx on public.activity_log (action_type);

comment on table public.activity_log is
  'Historial INVIOLABLE: solo INSERT. UPDATE/DELETE bloqueados por revoke + trigger. Ni owner ni service_role pueden alterarlo.';

-- ════════════════════════════════════════════════════════════════
-- INVIOLABILIDAD A NIVEL BASE DE DATOS (no opcional, no cosmético)
-- Tres candados: (1) sin políticas RLS de update/delete, (2) revoke de los
-- privilegios update/delete a TODOS los roles, (3) un trigger BEFORE que SIEMPRE
-- lanza excepción — éste se dispara incluso para el dueño de la tabla y para
-- service_role (que salta RLS), garantizando que el registro es para siempre.
-- ════════════════════════════════════════════════════════════════
create or replace function public.activity_log_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'El historial de actividad es INVIOLABLE: no se puede % un registro.',
    case tg_op when 'DELETE' then 'borrar' else 'modificar' end
    using errcode = 'check_violation';
end;
$$;

drop trigger if exists trg_activity_log_no_update on public.activity_log;
create trigger trg_activity_log_no_update
  before update on public.activity_log
  for each row execute function public.activity_log_immutable();

drop trigger if exists trg_activity_log_no_delete on public.activity_log;
create trigger trg_activity_log_no_delete
  before delete on public.activity_log
  for each row execute function public.activity_log_immutable();

-- Quita los privilegios de modificación/borrado a todo el mundo (defensa en
-- profundidad; el trigger es el candado final aunque alguien los reotorgue).
revoke update, delete, truncate on public.activity_log from public;
do $$ begin
  execute 'revoke update, delete, truncate on public.activity_log from authenticated';
  execute 'revoke update, delete, truncate on public.activity_log from anon';
exception when undefined_object then null; end $$;

-- ════════════════════════════════════════════════════════════════
-- RLS + FORCE
-- ════════════════════════════════════════════════════════════════
alter table public.employees        enable row level security;
alter table public.employees        force  row level security;
alter table public.employee_private enable row level security;
alter table public.employee_private force  row level security;
alter table public.activity_log     enable row level security;
alter table public.activity_log     force  row level security;

-- employees: lectura para autenticados; escritura solo admin/owner.
drop policy if exists employees_read on public.employees;
create policy employees_read on public.employees
  for select to authenticated using (true);
drop policy if exists employees_admin_write on public.employees;
create policy employees_admin_write on public.employees
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- employee_private: SOLO owner/admin lo ve o lo escribe. Privacidad real.
drop policy if exists employee_private_admin_read on public.employee_private;
create policy employee_private_admin_read on public.employee_private
  for select to authenticated using (public.is_admin());
drop policy if exists employee_private_admin_write on public.employee_private;
create policy employee_private_admin_write on public.employee_private
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- activity_log: lectura para autenticados; INSERT solo admin/owner. SIN políticas
-- de update/delete (RLS las niega), reforzado por el trigger inviolable.
drop policy if exists activity_log_read on public.activity_log;
create policy activity_log_read on public.activity_log
  for select to authenticated using (true);
drop policy if exists activity_log_insert on public.activity_log;
create policy activity_log_insert on public.activity_log
  for insert to authenticated with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- HELPERS
-- ════════════════════════════════════════════════════════════════

-- Resuelve el EMPLEADO autor de una acción dentro de un perfil. Prefiere el
-- app_user dado (ej. seller_id de la venta); cae al usuario autenticado; y como
-- último recurso devuelve un nombre legible. Devuelve (employee_id, actor_name).
create or replace function public.resolve_actor(p_profile profile_type, p_app_user uuid)
returns table (employee_id uuid, actor_name text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_emp uuid; v_name text;
begin
  if p_app_user is not null then
    select e.id, e.full_name into v_emp, v_name
      from employees e where e.app_user_id = p_app_user and e.profile_type = p_profile
      order by e.is_active desc limit 1;
  end if;
  if v_emp is null then
    select e.id, e.full_name into v_emp, v_name
      from employees e join app_users u on u.id = e.app_user_id
      where u.auth_id = auth.uid() and e.profile_type = p_profile
      order by e.is_active desc limit 1;
  end if;
  if v_name is null then
    select coalesce(u.display_name, 'Sistema') into v_name
      from app_users u
      where u.id = coalesce(p_app_user, (select id from app_users where auth_id = auth.uid()));
  end if;
  return query select v_emp, coalesce(v_name, 'Sistema');
end;
$$;

-- Inserta una entrada en el historial inviolable. SECURITY DEFINER: la usan los
-- triggers del sistema. (El trigger inviolable solo bloquea UPDATE/DELETE.)
create or replace function public.log_activity(
  p_profile profile_type, p_employee uuid, p_actor text, p_action text,
  p_entity text, p_entity_ref text, p_detail text, p_amount numeric,
  p_severity text default 'info', p_meta jsonb default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into activity_log (profile_type, employee_id, actor_name, action_type,
                            entity, entity_ref, detail, amount, severity, meta)
  values (p_profile, p_employee, coalesce(nullif(trim(p_actor),''),'Sistema'), p_action,
          p_entity, p_entity_ref, p_detail, p_amount,
          case when p_severity in ('info','warn') then p_severity else 'info' end, p_meta);
end;
$$;

-- ════════════════════════════════════════════════════════════════
-- TRIGGERS QUE ALIMENTAN EL HISTORIAL (desde el dato real existente)
-- ════════════════════════════════════════════════════════════════

-- Venta registrada (y descuento alto si corresponde).
create or replace function public.tg_log_sale_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare a record; v_disc_pct numeric;
begin
  select * into a from resolve_actor(new.profile_type, new.seller_id);
  perform log_activity(new.profile_type, a.employee_id, a.actor_name, 'venta',
    'venta', coalesce(new.ncf, left(new.id::text,8)),
    'Registró venta por ' || to_char(new.total, 'FM999,999,990.00') || ' RD$', new.total, 'info',
    jsonb_build_object('sale_id', new.id, 'method', new.payment_method));
  if coalesce(new.discount,0) > 0 and (new.total + new.discount) > 0 then
    v_disc_pct := round(new.discount / (new.total + new.discount) * 100, 1);
    if v_disc_pct >= 15 then
      perform log_activity(new.profile_type, a.employee_id, a.actor_name, 'descuento_alto',
        'venta', coalesce(new.ncf, left(new.id::text,8)),
        'Aplicó descuento alto de ' || v_disc_pct || '% (' || to_char(new.discount,'FM999,999,990.00') || ' RD$)',
        new.discount, 'warn', jsonb_build_object('sale_id', new.id, 'pct', v_disc_pct));
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_log_sale_insert on public.sales;
create trigger trg_log_sale_insert after insert on public.sales
  for each row execute function public.tg_log_sale_insert();

-- Venta anulada.
create or replace function public.tg_log_sale_void()
returns trigger language plpgsql security definer set search_path = public as $$
declare a record;
begin
  if new.status = 'anulada' and old.status is distinct from 'anulada' then
    select * into a from resolve_actor(new.profile_type, new.voided_by);
    perform log_activity(new.profile_type, a.employee_id, a.actor_name, 'venta_anulada',
      'venta', coalesce(new.ncf, left(new.id::text,8)),
      'Anuló venta de ' || to_char(new.total,'FM999,999,990.00') || ' RD$'
        || coalesce(' — motivo: ' || nullif(new.void_reason,''), ''),
      new.total, 'warn', jsonb_build_object('sale_id', new.id, 'reason', new.void_reason));
  end if;
  return new;
end; $$;

drop trigger if exists trg_log_sale_void on public.sales;
create trigger trg_log_sale_void after update of status on public.sales
  for each row execute function public.tg_log_sale_void();

-- Cambio de precio de un producto.
create or replace function public.tg_log_price_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare a record;
begin
  if new.price is distinct from old.price then
    select * into a from resolve_actor(new.profile_type, null);
    perform log_activity(new.profile_type, a.employee_id, a.actor_name, 'precio_cambiado',
      'producto', new.sku,
      'Cambió precio de "' || new.name || '" de ' || to_char(old.price,'FM999,999,990.00')
        || ' a ' || to_char(new.price,'FM999,999,990.00') || ' RD$',
      new.price, case when new.price < old.price then 'warn' else 'info' end,
      jsonb_build_object('product_id', new.id, 'old', old.price, 'new', new.price));
  end if;
  return new;
end; $$;

drop trigger if exists trg_log_price_change on public.products;
create trigger trg_log_price_change after update of price on public.products
  for each row execute function public.tg_log_price_change();

-- Apertura de caja.
create or replace function public.tg_log_cash_open()
returns trigger language plpgsql security definer set search_path = public as $$
declare a record;
begin
  select * into a from resolve_actor(new.profile_type, new.opened_by);
  perform log_activity(new.profile_type, a.employee_id, a.actor_name, 'caja_abierta',
    'caja', left(new.id::text,8),
    'Abrió la caja con fondo de ' || to_char(new.opening_amount,'FM999,999,990.00') || ' RD$',
    new.opening_amount, 'info', jsonb_build_object('register_id', new.id));
  return new;
end; $$;

drop trigger if exists trg_log_cash_open on public.cash_registers;
create trigger trg_log_cash_open after insert on public.cash_registers
  for each row execute function public.tg_log_cash_open();

-- Cierre de caja (y arqueo faltante si la diferencia es negativa).
create or replace function public.tg_log_cash_close()
returns trigger language plpgsql security definer set search_path = public as $$
declare a record;
begin
  if new.status = 'cerrada' and old.status is distinct from 'cerrada' then
    select * into a from resolve_actor(new.profile_type, new.closed_by);
    perform log_activity(new.profile_type, a.employee_id, a.actor_name, 'caja_cerrada',
      'caja', left(new.id::text,8),
      'Cerró la caja — esperado ' || to_char(coalesce(new.expected_cash,0),'FM999,999,990.00')
        || ', contado ' || to_char(coalesce(new.counted_cash,0),'FM999,999,990.00') || ' RD$',
      new.counted_cash, case when coalesce(new.difference,0) < 0 then 'warn' else 'info' end,
      jsonb_build_object('register_id', new.id, 'difference', new.difference));
    if coalesce(new.difference,0) < 0 then
      perform log_activity(new.profile_type, a.employee_id, a.actor_name, 'arqueo_faltante',
        'caja', left(new.id::text,8),
        'Faltante de arqueo de ' || to_char(abs(new.difference),'FM999,999,990.00') || ' RD$ en el cierre',
        new.difference, 'warn', jsonb_build_object('register_id', new.id, 'difference', new.difference));
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_log_cash_close on public.cash_registers;
create trigger trg_log_cash_close after update of status on public.cash_registers
  for each row execute function public.tg_log_cash_close();

-- Egreso de caja.
create or replace function public.tg_log_cash_egreso()
returns trigger language plpgsql security definer set search_path = public as $$
declare a record;
begin
  if new.kind = 'egreso' then
    select * into a from resolve_actor(new.profile_type, new.created_by);
    perform log_activity(new.profile_type, a.employee_id, a.actor_name, 'egreso_caja',
      'caja', coalesce(new.category,'Egreso'),
      'Registró egreso de ' || to_char(new.amount,'FM999,999,990.00') || ' RD$'
        || coalesce(' — ' || nullif(new.reason,''), ''),
      new.amount, 'info', jsonb_build_object('movement_id', new.id, 'category', new.category));
  end if;
  return new;
end; $$;

drop trigger if exists trg_log_cash_egreso on public.cash_movements;
create trigger trg_log_cash_egreso after insert on public.cash_movements
  for each row execute function public.tg_log_cash_egreso();

-- ════════════════════════════════════════════════════════════════
-- ALERTAS INTELIGENTES — calculadas sobre el historial inmutable.
-- Marca patrones que un dueño querría vigilar. Lenguaje neutro (vigilancia,
-- no acusación). Umbrales razonables y relativos al promedio de la tienda.
-- ════════════════════════════════════════════════════════════════
create or replace function public.employee_alerts(p_profile profile_type, p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_since timestamptz := now() - make_interval(days => greatest(1, coalesce(p_days,30)));
  v_avg_anul numeric := 0;
  v_result jsonb := '[]'::jsonb;
  r record;
  v_flags jsonb;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

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
$$;

-- ════════════════════════════════════════════════════════════════
-- CRUD de empleados (SECURITY DEFINER, valida admin, alimenta el historial).
-- ════════════════════════════════════════════════════════════════
create or replace function public.employee_actor()
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_role app_role;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  select id, role into v_id, v_role from app_users where auth_id = auth.uid();
  if v_id is null or v_role not in ('owner','admin') then
    raise exception 'No autorizado para gestionar empleados';
  end if;
  return v_id;
end; $$;

create or replace function public.employee_upsert(
  p_id uuid, p_profile profile_type, p_full_name text, p_cedula text, p_phone text,
  p_role employee_role, p_username text, p_photo_url text, p_hired_at date,
  p_salary numeric, p_notes text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_actor uuid; v_id uuid; v_is_new boolean := false; a record;
begin
  perform employee_actor();
  if coalesce(trim(p_full_name),'') = '' then raise exception 'El nombre es obligatorio'; end if;

  if p_id is null then
    insert into employees (profile_type, full_name, cedula, phone, role, username,
                           photo_url, hired_at, notes)
    values (p_profile, trim(p_full_name), nullif(trim(p_cedula),''), nullif(trim(p_phone),''),
            coalesce(p_role,'vendedor'), nullif(trim(p_username),''), nullif(trim(p_photo_url),''),
            coalesce(p_hired_at, current_date), nullif(trim(p_notes),''))
    returning id into v_id;
    v_is_new := true;
  else
    update employees set
      full_name = trim(p_full_name), cedula = nullif(trim(p_cedula),''),
      phone = nullif(trim(p_phone),''), role = coalesce(p_role, role),
      username = nullif(trim(p_username),''), photo_url = nullif(trim(p_photo_url),''),
      hired_at = coalesce(p_hired_at, hired_at), notes = nullif(trim(p_notes),'')
    where id = p_id and profile_type = p_profile
    returning id into v_id;
    if v_id is null then raise exception 'Empleado no encontrado'; end if;
  end if;

  -- Salario (privado): solo se guarda si viene un valor.
  if p_salary is not null then
    insert into employee_private (employee_id, salary, updated_at)
    values (v_id, greatest(0, p_salary), now())
    on conflict (employee_id) do update set salary = excluded.salary, updated_at = now();
  end if;

  select * into a from resolve_actor(p_profile, null);
  perform log_activity(p_profile, nullif(a.employee_id, null), a.actor_name,
    case when v_is_new then 'empleado_creado' else 'empleado_editado' end,
    'empleado', trim(p_full_name),
    case when v_is_new then 'Registró al empleado ' else 'Editó al empleado ' end || trim(p_full_name),
    null, 'info', jsonb_build_object('employee_id', v_id));
  return v_id;
end; $$;

create or replace function public.employee_set_active(p_id uuid, p_active boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare e employees; a record;
begin
  perform employee_actor();
  select * into e from employees where id = p_id;
  if e.id is null then raise exception 'Empleado no encontrado'; end if;
  update employees set is_active = coalesce(p_active, true) where id = p_id;
  select * into a from resolve_actor(e.profile_type, null);
  perform log_activity(e.profile_type, a.employee_id, a.actor_name,
    case when p_active then 'empleado_reactivado' else 'empleado_desactivado' end,
    'empleado', e.full_name,
    case when p_active then 'Reactivó a ' else 'Desactivó a ' end || e.full_name,
    null, 'info', jsonb_build_object('employee_id', e.id));
end; $$;

-- Permisos: solo authenticated invoca; el rol se valida adentro. Nada para anon.
do $$
declare f text;
begin
  foreach f in array array[
    'resolve_actor(profile_type, uuid)',
    'employee_alerts(profile_type, integer)',
    'employee_upsert(uuid, profile_type, text, text, text, employee_role, text, text, date, numeric, text)',
    'employee_set_active(uuid, boolean)'
  ]
  loop
    execute format('revoke all on function public.%s from public, anon;', f);
    execute format('grant execute on function public.%s to authenticated;', f);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════
-- SEMILLA — plantilla por tienda + actividad histórica creíble.
-- Idempotente: empleados con on-conflict; actividad solo si el log está vacío.
-- ════════════════════════════════════════════════════════════════
do $$
declare
  v_owner uuid;
  -- Celulares
  cel_admin uuid; cel_v1 uuid; cel_v2 uuid; cel_caj uuid;
  -- Electrónicas
  ele_admin uuid; ele_v1 uuid; ele_v2 uuid; ele_caj uuid;
begin
  select id into v_owner from app_users order by (role='owner') desc, created_at asc limit 1;

  -- ── Empleados CELULARES ──
  insert into employees (profile_type, full_name, cedula, phone, role, username, hired_at, app_user_id) values
    ('celulares','Pedro Alberto Guzmán','402-1234567-1','809-555-2201','administrador','pguzman', current_date - 420, v_owner)
    on conflict (cedula) do nothing;
  insert into employees (profile_type, full_name, cedula, phone, role, username, hired_at) values
    ('celulares','Wandy Manuel Ureña','001-1122334-5','829-555-2202','vendedor','wurena', current_date - 300),
    ('celulares','Estarlin de Jesús Pérez','223-9988776-3','849-555-2203','vendedor','eperez', current_date - 180),
    ('celulares','Massiel Carolina Abreu','031-4455667-8','809-555-2204','cajero','mabreu', current_date - 150)
    on conflict (cedula) do nothing;

  -- ── Empleados ELECTRÓNICAS ──
  insert into employees (profile_type, full_name, cedula, phone, role, username, hired_at, app_user_id) values
    ('electronicas','Ramón Antonio Then','402-7654321-9','809-555-3301','administrador','rthen', current_date - 400, v_owner)
    on conflict (cedula) do nothing;
  insert into employees (profile_type, full_name, cedula, phone, role, username, hired_at) values
    ('electronicas','Yefri Alexander Núñez','001-5566778-9','829-555-3302','vendedor','ynunez', current_date - 260),
    ('electronicas','Geraldine Mercedes Lora','402-3344556-7','849-555-3303','vendedor','glora', current_date - 120),
    ('electronicas','Franklin José Disla','223-1212121-2','809-555-3304','cajero','fdisla', current_date - 90)
    on conflict (cedula) do nothing;

  select id into cel_admin from employees where cedula='402-1234567-1';
  select id into cel_v1    from employees where cedula='001-1122334-5';
  select id into cel_v2    from employees where cedula='223-9988776-3';
  select id into cel_caj   from employees where cedula='031-4455667-8';
  select id into ele_admin from employees where cedula='402-7654321-9';
  select id into ele_v1    from employees where cedula='001-5566778-9';
  select id into ele_v2    from employees where cedula='402-3344556-7';
  select id into ele_caj   from employees where cedula='223-1212121-2';

  -- Salarios (privado).
  insert into employee_private (employee_id, salary) values
    (cel_admin, 55000), (cel_v1, 28000), (cel_v2, 26000), (cel_caj, 27000),
    (ele_admin, 58000), (ele_v1, 30000), (ele_v2, 27000), (ele_caj, 28000)
    on conflict (employee_id) do nothing;

  -- ── Actividad histórica (solo una vez) ──
  if (select count(*) from activity_log) = 0 then
    -- Inserción directa (la semilla es histórica; los triggers cubren lo nuevo).
    -- CELULARES: actividad normal de ventas repartida.
    insert into activity_log (profile_type, employee_id, actor_name, action_type, entity, entity_ref, detail, amount, severity, created_at)
    select 'celulares', cel_v1, 'Wandy Manuel Ureña', 'venta', 'venta', 'B02'||lpad((1000+g)::text,8,'0'),
           'Registró venta por '||to_char((6000+g*350)::numeric,'FM999,999,990.00')||' RD$', (6000+g*350), 'info',
           now() - make_interval(days => (g % 24), hours => (g*2 % 24))
    from generate_series(1,16) g;

    insert into activity_log (profile_type, employee_id, actor_name, action_type, entity, entity_ref, detail, amount, severity, created_at)
    select 'celulares', cel_v2, 'Estarlin de Jesús Pérez', 'venta', 'venta', 'B02'||lpad((1100+g)::text,8,'0'),
           'Registró venta por '||to_char((7000+g*420)::numeric,'FM999,999,990.00')||' RD$', (7000+g*420), 'info',
           now() - make_interval(days => (g % 22), hours => (g*3 % 24))
    from generate_series(1,11) g;

    -- CELULARES: Estarlin con ANULACIONES frecuentes (dispara la alerta) + un faltante.
    insert into activity_log (profile_type, employee_id, actor_name, action_type, entity, entity_ref, detail, amount, severity, created_at)
    select 'celulares', cel_v2, 'Estarlin de Jesús Pérez', 'venta_anulada', 'venta', 'B02'||lpad((1100+g)::text,8,'0'),
           'Anuló venta de '||to_char((7000+g*420)::numeric,'FM999,999,990.00')||' RD$ — motivo: '||
             (array['cliente se arrepintió','error de cobro','producto cambiado','precio incorrecto','duplicada','pago no entró'])[1+(g % 6)],
           (7000+g*420), 'warn', now() - make_interval(days => (g % 18), hours => (g*5 % 24))
    from generate_series(1,6) g;

    insert into activity_log (profile_type, employee_id, actor_name, action_type, entity, entity_ref, detail, amount, severity, created_at) values
      ('celulares', cel_v2, 'Estarlin de Jesús Pérez', 'descuento_alto', 'venta', 'B02'||lpad('1188',8,'0'),
        'Aplicó descuento alto de 22% (4,200.00 RD$)', 4200, 'warn', now() - make_interval(days => 4)),
      ('celulares', cel_v2, 'Estarlin de Jesús Pérez', 'descuento_alto', 'venta', 'B02'||lpad('1190',8,'0'),
        'Aplicó descuento alto de 18% (3,100.00 RD$)', 3100, 'warn', now() - make_interval(days => 9)),
      ('celulares', cel_v2, 'Estarlin de Jesús Pérez', 'descuento_alto', 'venta', 'B02'||lpad('1192',8,'0'),
        'Aplicó descuento alto de 25% (5,000.00 RD$)', 5000, 'warn', now() - make_interval(days => 13)),
      ('celulares', cel_caj, 'Massiel Carolina Abreu', 'caja_abierta', 'caja', 'CAJ-01',
        'Abrió la caja con fondo de 5,000.00 RD$', 5000, 'info', now() - make_interval(days => 2, hours => 9)),
      ('celulares', cel_caj, 'Massiel Carolina Abreu', 'arqueo_faltante', 'caja', 'CAJ-01',
        'Faltante de arqueo de 1,250.00 RD$ en el cierre', -1250, 'warn', now() - make_interval(days => 2)),
      ('celulares', cel_caj, 'Massiel Carolina Abreu', 'arqueo_faltante', 'caja', 'CAJ-02',
        'Faltante de arqueo de 800.00 RD$ en el cierre', -800, 'warn', now() - make_interval(days => 8)),
      ('celulares', cel_admin, 'Pedro Alberto Guzmán', 'precio_cambiado', 'producto', 'CEL-IP15-128',
        'Cambió precio de "iPhone 15 128GB" de 64,000.00 a 62,500.00 RD$', 62500, 'warn', now() - make_interval(days => 5)),
      ('celulares', cel_admin, 'Pedro Alberto Guzmán', 'empleado_creado', 'empleado', 'Wandy Manuel Ureña',
        'Registró al empleado Wandy Manuel Ureña', null, 'info', now() - make_interval(days => 300));

    -- ELECTRÓNICAS: actividad normal (independiente, no mezcla con Celulares).
    insert into activity_log (profile_type, employee_id, actor_name, action_type, entity, entity_ref, detail, amount, severity, created_at)
    select 'electronicas', ele_v1, 'Yefri Alexander Núñez', 'venta', 'venta', 'B02'||lpad((2000+g)::text,8,'0'),
           'Registró venta por '||to_char((9000+g*650)::numeric,'FM999,999,990.00')||' RD$', (9000+g*650), 'info',
           now() - make_interval(days => (g % 20), hours => (g*2 % 24))
    from generate_series(1,14) g;

    insert into activity_log (profile_type, employee_id, actor_name, action_type, entity, entity_ref, detail, amount, severity, created_at)
    select 'electronicas', ele_v2, 'Geraldine Mercedes Lora', 'venta', 'venta', 'B02'||lpad((2100+g)::text,8,'0'),
           'Registró venta por '||to_char((11000+g*800)::numeric,'FM999,999,990.00')||' RD$', (11000+g*800), 'info',
           now() - make_interval(days => (g % 16), hours => (g*4 % 24))
    from generate_series(1,9) g;

    -- ELECTRÓNICAS: Geraldine con CAMBIOS DE PRECIO frecuentes (dispara la alerta).
    insert into activity_log (profile_type, employee_id, actor_name, action_type, entity, entity_ref, detail, amount, severity, created_at)
    select 'electronicas', ele_v2, 'Geraldine Mercedes Lora', 'precio_cambiado', 'producto',
           (array['ELE-TVLG55','ELE-PS5','ELE-MONLG27','ELE-LAPHP15','ELE-IMPEPL3150','ELE-AUDSONY'])[1+(g % 6)],
           'Bajó el precio de un producto', (15000 - g*300), 'warn',
           now() - make_interval(days => (g*2 % 20), hours => (g % 24))
    from generate_series(1,5) g;

    insert into activity_log (profile_type, employee_id, actor_name, action_type, entity, entity_ref, detail, amount, severity, created_at) values
      ('electronicas', ele_admin, 'Ramón Antonio Then', 'caja_abierta', 'caja', 'CAJ-E1',
        'Abrió la caja con fondo de 8,000.00 RD$', 8000, 'info', now() - make_interval(days => 1, hours => 9)),
      ('electronicas', ele_admin, 'Ramón Antonio Then', 'caja_cerrada', 'caja', 'CAJ-E1',
        'Cerró la caja — esperado 42,300.00, contado 42,300.00 RD$', 42300, 'info', now() - make_interval(days => 1)),
      ('electronicas', ele_v1, 'Yefri Alexander Núñez', 'venta_anulada', 'venta', 'B02'||lpad('2044',8,'0'),
        'Anuló venta de 9,650.00 RD$ — motivo: cliente cambió de modelo', 9650, 'warn', now() - make_interval(days => 6));
  end if;
end $$;
