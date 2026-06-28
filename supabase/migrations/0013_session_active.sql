-- ════════════════════════════════════════════════════════════════
-- JM TECH — TANDA 10E: session_active() — cierre de la última rendija
-- Migración 0013 — Bloquea a NIVEL BASE DE DATOS el acceso de cuentas vencidas
-- o revocadas, aunque tengan un JWT aún válido. Antes el vencimiento se validaba
-- en login + layout (app); ahora también en RLS, así que la REST API devuelve
-- 0 filas para una cuenta vencida sin importar el token.
--
-- Se aplica a las tablas de datos del negocio (lectura y escritura admin). NO
-- se toca app_users.self (el login/getSessionUser necesitan leer la propia fila
-- para DETECTAR el vencimiento) ni system_settings (config no sensible).
-- service_role (admin client) salta RLS por completo: el backend no se afecta.
-- ════════════════════════════════════════════════════════════════

-- ── Predicado: ¿la sesión actual está vigente? ───────────────────
-- SECURITY DEFINER: lee app_users saltando RLS (sin recursión de políticas).
-- owner nunca vence. anon / sin fila / vencida / revocada → false.
create or replace function public.session_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (u.role = 'owner')
            or (u.is_active and (u.access_expires_at is null or u.access_expires_at > now()))
       from app_users u
      where u.auth_id = auth.uid()),
    false
  );
$$;

revoke all on function public.session_active() from public, anon;
grant execute on function public.session_active() to authenticated;

-- ── Tablas de negocio con patrón uniforme (_read + _admin_write) ──
do $$
declare t text;
begin
  foreach t in array array[
    'products','customers','sales','sale_items','orders','warranties',
    'cash_registers','cash_movements','sale_payments','employees','suppliers','repairs'
  ]
  loop
    execute format($p$
      drop policy if exists %1$s_read on public.%1$s;
      create policy %1$s_read on public.%1$s for select to authenticated
        using (public.session_active());
    $p$, t);
    execute format($p$
      drop policy if exists %1$s_admin_write on public.%1$s;
      create policy %1$s_admin_write on public.%1$s for all to authenticated
        using (public.is_admin() and public.session_active())
        with check (public.is_admin() and public.session_active());
    $p$, t);
  end loop;
end $$;

-- ── employee_private (salario): admin + sesión vigente ───────────
drop policy if exists employee_private_admin_read on public.employee_private;
create policy employee_private_admin_read on public.employee_private
  for select to authenticated using (public.is_admin() and public.session_active());
drop policy if exists employee_private_admin_write on public.employee_private;
create policy employee_private_admin_write on public.employee_private
  for all to authenticated
  using (public.is_admin() and public.session_active())
  with check (public.is_admin() and public.session_active());

-- ── activity_log: lectura solo con sesión vigente (sigue inviolable) ──
drop policy if exists activity_log_read on public.activity_log;
create policy activity_log_read on public.activity_log
  for select to authenticated using (public.session_active());
-- El INSERT directo ya está revocado (10D); los triggers alimentan como dueño.
drop policy if exists activity_log_insert on public.activity_log;
create policy activity_log_insert on public.activity_log
  for insert to authenticated with check (public.is_admin() and public.session_active());

-- ── app_users: el listado/escritura admin exige sesión vigente, pero la
-- LECTURA DE LA PROPIA FILA queda abierta (login/getSessionUser deben poder
-- leer el vencimiento para aplicarlo). ──
drop policy if exists app_users_select_self_or_admin on public.app_users;
create policy app_users_select_self_or_admin on public.app_users
  for select to authenticated
  using (auth_id = auth.uid() or (public.is_admin() and public.session_active()));
drop policy if exists app_users_admin_all on public.app_users;
create policy app_users_admin_all on public.app_users
  for all to authenticated
  using (public.is_admin() and public.session_active())
  with check (public.is_admin() and public.session_active());
-- app_users_update_self se deja intacta (cada quien edita su propia fila).
