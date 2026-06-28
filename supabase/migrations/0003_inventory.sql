-- ════════════════════════════════════════════════════════════════
-- JM TECH — TANDA 3: INVENTARIO POR PERFIL
-- Migración 0003 — Enriquece `products` con los campos del inventario real.
-- Campos COMUNES como columnas; los ESPECÍFICOS de cada perfil viven en
-- `attributes` (jsonb): celulares → {imei, storage, ram, network};
-- electronicas → {serial_number, voltage, specs}.
-- Soft-delete con `active` (no rompe ventas históricas que referencien el
-- producto). NO se crea tabla nueva: nos colgamos de `products`.
--
-- `products` ya tiene RLS + FORCE y políticas (lectura autenticados, escritura
-- solo admin) desde 0002 — añadir columnas no requiere políticas nuevas.
-- ════════════════════════════════════════════════════════════════

alter table public.products
  add column if not exists model           text,
  add column if not exists color           text,
  add column if not exists condition       text not null default 'nuevo',
  add column if not exists supplier         text,
  add column if not exists warranty_months integer not null default 12 check (warranty_months >= 0),
  add column if not exists entry_date       date not null default current_date,
  add column if not exists active           boolean not null default true,
  add column if not exists attributes       jsonb not null default '{}'::jsonb,
  add column if not exists updated_at        timestamptz not null default now();

-- Estados válidos (cubre ambos perfiles; 'exhibicion' solo aplica a electrónicas
-- en la UI, pero el check los admite a todos para flexibilidad).
do $$ begin
  alter table public.products
    add constraint products_condition_chk
    check (condition in ('nuevo','usado','reacondicionado','exhibicion'));
exception when duplicate_object then null; end $$;

create index if not exists products_active_idx on public.products (active);

-- updated_at automático (reusa el trigger de 0001).
drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated
  before update on public.products
  for each row execute function public.set_updated_at();

-- ── Backfill ligero de los 20 productos sembrados ────────────────
-- Para que se vean completos en el detalle. Deriva `model` del nombre,
-- asigna proveedor dominicano y rellena atributos por perfil de forma
-- creíble. Solo toca filas con atributos vacíos (idempotente).

-- Proveedores dominicanos rotando por sku (determinista).
update public.products set supplier = sub.supplier
from (
  select sku,
    (array['Importadora Caribe Tech','Distribuidora La Sirena Móvil',
           'TecnoStore RD','Mayorista Duarte','Electro Importaciones SRL'])[
      1 + (abs(hashtext(sku)) % 5)] as supplier
  from public.products
) sub
where public.products.sku = sub.sku and public.products.supplier is null;

-- model = nombre (si no hay modelo aún).
update public.products set model = name where model is null;

-- color por defecto donde falte.
update public.products set color = 'Estándar' where color is null;

-- Atributos CELULARES (solo si vacíos).
update public.products
set attributes = jsonb_build_object(
  'imei', '',
  'storage', case when name ilike '%256%' then '256GB'
                  when name ilike '%128%' then '128GB'
                  when category ilike '%accesorio%' then ''
                  else '128GB' end,
  'ram', case when category ilike '%accesorio%' then '' else '8GB' end,
  'network', case when category ilike '%accesorio%' then '' else '5G' end
)
where profile_type = 'celulares' and (attributes = '{}'::jsonb or attributes is null);

-- Atributos ELECTRÓNICAS (solo si vacíos).
update public.products
set attributes = jsonb_build_object(
  'serial_number', '',
  'voltage', case when category ilike '%consola%' or category ilike '%tv%'
                   or category ilike '%monitor%' or category ilike '%impresora%'
                  then '110V' else 'Dual' end,
  'specs', ''
)
where profile_type = 'electronicas' and (attributes = '{}'::jsonb or attributes is null);
