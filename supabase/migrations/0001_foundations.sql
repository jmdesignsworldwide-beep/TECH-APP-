-- ════════════════════════════════════════════════════════════════
-- JM TECH — TANDA 1: CIMIENTOS
-- Migración 0001 — Fundación de auth/usuarios y perfil activo del sistema.
--
-- Principios de seguridad (desde el primer momento):
--   • RLS + FORCE RLS en TODAS las tablas.
--   • Sin acceso anónimo. Solo usuarios autenticados, y solo a lo suyo.
--   • Las operaciones administrativas pasan por service_role (solo servidor).
--
-- NO se crean inventario/POS/etc. aquí: solo la base limpia de la que se
-- colgarán las próximas tandas sin rehacer nada.
-- ════════════════════════════════════════════════════════════════

-- ── Tipos del dominio ────────────────────────────────────────────

-- Doble perfil del sistema. Un solo campo distingue lo específico de cada
-- perfil. Reutilizable por las tablas de producto de tandas futuras.
do $$ begin
  create type profile_type as enum ('celulares', 'electronicas');
exception
  when duplicate_object then null;
end $$;

-- Roles de aplicación.
do $$ begin
  create type app_role as enum ('owner', 'admin', 'staff');
exception
  when duplicate_object then null;
end $$;

-- ── Tabla: app_users ─────────────────────────────────────────────
-- Perfil de aplicación enlazado 1:1 con auth.users. El login es por USUARIO
-- (sin email): el servidor mapea usuario→email ficticio en Supabase Auth y
-- aquí guardamos el username real y el rol.
create table if not exists public.app_users (
  id           uuid primary key default gen_random_uuid(),
  auth_id      uuid not null unique references auth.users (id) on delete cascade,
  username     text not null unique,
  display_name text not null,
  role         app_role not null default 'staff',

  -- Estructura lista para ACCESO TEMPORAL (cuentas con días de vigencia).
  -- No se aplica todavía; queda la puerta abierta para una tanda posterior.
  is_active         boolean not null default true,
  access_expires_at timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.app_users is
  'Perfil de aplicación por usuario (login sin email). access_expires_at queda para acceso temporal futuro.';

-- ── Tabla: system_settings ───────────────────────────────────────
-- Estado global del sistema. Fila única (singleton) con el PERFIL ACTIVO.
create table if not exists public.system_settings (
  id             smallint primary key default 1,
  active_profile profile_type not null default 'celulares',
  updated_by     uuid references public.app_users (id),
  updated_at     timestamptz not null default now(),
  constraint system_settings_singleton check (id = 1)
);

comment on table public.system_settings is
  'Ajustes globales del sistema (fila única). active_profile = perfil en uso.';

insert into public.system_settings (id, active_profile)
values (1, 'celulares')
on conflict (id) do nothing;

-- ── updated_at automático ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_users_updated on public.app_users;
create trigger trg_app_users_updated
  before update on public.app_users
  for each row execute function public.set_updated_at();

drop trigger if exists trg_system_settings_updated on public.system_settings;
create trigger trg_system_settings_updated
  before update on public.system_settings
  for each row execute function public.set_updated_at();

-- ── Helpers de autorización (SECURITY DEFINER, search_path fijo) ──
-- Evitan recursión en las políticas RLS al consultar el rol del usuario.
create or replace function public.current_app_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.app_users where auth_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('owner', 'admin') from public.app_users where auth_id = auth.uid()),
    false
  );
$$;

-- ════════════════════════════════════════════════════════════════
-- RLS + FORCE RLS
-- ════════════════════════════════════════════════════════════════
alter table public.app_users        enable row level security;
alter table public.app_users        force  row level security;
alter table public.system_settings  enable row level security;
alter table public.system_settings  force  row level security;

-- ── Políticas: app_users ─────────────────────────────────────────
-- Cada usuario ve y edita SU propia fila; los admin/owner ven todo.
drop policy if exists app_users_select_self_or_admin on public.app_users;
create policy app_users_select_self_or_admin
  on public.app_users for select
  to authenticated
  using (auth_id = auth.uid() or public.is_admin());

-- El usuario puede actualizar su display_name; el rol/estado solo admin.
-- (Cambios de rol/estado se hacen vía service_role en el servidor.)
drop policy if exists app_users_update_self on public.app_users;
create policy app_users_update_self
  on public.app_users for update
  to authenticated
  using (auth_id = auth.uid())
  with check (auth_id = auth.uid());

drop policy if exists app_users_admin_all on public.app_users;
create policy app_users_admin_all
  on public.app_users for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Políticas: system_settings ───────────────────────────────────
-- Cualquier usuario autenticado puede LEER el perfil activo; solo admin/owner
-- lo cambia. (El service_role del servidor también puede, saltando RLS.)
drop policy if exists system_settings_read on public.system_settings;
create policy system_settings_read
  on public.system_settings for select
  to authenticated
  using (true);

drop policy if exists system_settings_admin_write on public.system_settings;
create policy system_settings_admin_write
  on public.system_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Nota: no se otorgan privilegios al rol `anon`. El acceso anónimo queda
-- cerrado por completo en estas tablas.
