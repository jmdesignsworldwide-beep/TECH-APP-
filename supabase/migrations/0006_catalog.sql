-- ════════════════════════════════════════════════════════════════
-- JM TECH — TANDA 5: NAVEGACIÓN JERÁRQUICA (Categoría → Marca → Modelo)
-- Migración 0006 — Catálogo en árbol por perfil.
--   categories      : categorías madre por perfil (nivel 1)
--   brands          : catálogo de marcas por perfil
--   category_brands : qué marcas aparecen bajo qué categoría (nivel 2)
-- Los productos siguen en `products` (texto category/brand); el árbol se cuelga
-- por nombre. Counts en vivo desde products. RLS + FORCE en las 3 tablas.
-- Idempotente: limpia y resiembra el catálogo; reasigna productos sin duplicar.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  profile_type profile_type not null,
  name         text not null,
  sort_order   integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (profile_type, name)
);

create table if not exists public.brands (
  id           uuid primary key default gen_random_uuid(),
  profile_type profile_type not null,
  name         text not null,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (profile_type, name)
);

create table if not exists public.category_brands (
  profile_type  profile_type not null,
  category_name text not null,
  brand_name    text not null,
  created_at    timestamptz not null default now(),
  primary key (profile_type, category_name, brand_name)
);

-- ── RLS + FORCE (lectura autenticados, escritura admin) ──────────
do $$
declare t text;
begin
  foreach t in array array['categories','brands','category_brands']
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

-- ── Reasignar productos sembrados a su categoría/marca correctas ─
-- Smartphones (antes "Celulares/Smartphones").
update public.products set category = 'Smartphones'
  where profile_type = 'celulares' and category = 'Celulares/Smartphones';
-- Consolas: marca PlayStation / Xbox (antes Sony / Microsoft) para el árbol.
update public.products set brand = 'PlayStation'
  where profile_type = 'electronicas' and name ilike 'PlayStation%';
update public.products set brand = 'Xbox'
  where profile_type = 'electronicas' and name ilike 'Xbox%';

-- ── Sembrar catálogo (idempotente) ──────────────────────────────
truncate table public.category_brands;
delete from public.categories;
delete from public.brands;

-- Categorías por perfil (orden = posición en el array).
insert into public.categories (profile_type, name, sort_order)
select 'celulares', name, ord from unnest(array[
  'Smartphones','Tablets/iPads','Smartwatches','Auriculares/AirPods',
  'Cargadores/Cables','Cases/Fundas','Protectores','Power Banks','Memorias','Accesorios'
]) with ordinality as t(name, ord);

insert into public.categories (profile_type, name, sort_order)
select 'electronicas', name, ord from unnest(array[
  'Laptops/Computadoras','Monitores','Impresoras','Consolas','Videojuegos',
  'TVs/Smart TV','Sonido/Bocinas','Auriculares/Headsets','Cámaras','Drones',
  'Proyectores','Seguridad/Cámaras IP','Routers','Memorias/Discos','Periféricos',
  'Cables','Cargadores','Componentes PC','Smart Home','Wearables'
]) with ordinality as t(name, ord);

-- Marcas por perfil (catálogo rico + las que usan los productos sembrados).
insert into public.brands (profile_type, name)
select 'celulares', name from unnest(array[
  'Apple','Samsung','Xiaomi','Motorola','Huawei','Honor','Tecno','Infinix',
  'Realme','OnePlus','Google Pixel','ZTE','Anker','Spigen'
]) as t(name);

insert into public.brands (profile_type, name)
select 'electronicas', name from unnest(array[
  'HP','Lenovo','Dell','ASUS','Acer','Apple','MSI','LG','Sony','Samsung',
  'TCL','Hisense','Xbox','PlayStation','Nintendo','Canon','Nikon','DJI',
  'JBL','Bose','Logitech','HyperX','Epson'
]) as t(name);

-- category_brands: derivado de los productos reales…
insert into public.category_brands (profile_type, category_name, brand_name)
select distinct profile_type, category, brand from public.products where active
on conflict do nothing;

-- …más todas las marcas de smartphones bajo "Smartphones" (riqueza del árbol).
insert into public.category_brands (profile_type, category_name, brand_name)
select 'celulares', 'Smartphones', name from unnest(array[
  'Apple','Samsung','Xiaomi','Motorola','Huawei','Honor','Tecno','Infinix',
  'Realme','OnePlus','Google Pixel','ZTE'
]) as t(name)
on conflict do nothing;
