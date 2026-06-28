-- ════════════════════════════════════════════════════════════════
-- JM TECH — TANDA 5 (corrección)
-- Migración 0007 — Los productos sembrados (0001) usaban nombres de categoría
-- en singular ("Smartphone", "Consola", "Laptop"…) que no coincidían con el
-- catálogo del árbol (0006). Aquí los reasignamos a los nombres del catálogo y
-- reconstruimos category_brands desde los productos corregidos. Idempotente.
-- ════════════════════════════════════════════════════════════════

-- ── Celulares ────────────────────────────────────────────────────
update public.products set category = 'Smartphones'
  where profile_type = 'celulares' and category in ('Smartphone', 'Celulares/Smartphones');
update public.products set category = 'Auriculares/AirPods'
  where profile_type = 'celulares' and (name ilike '%AirPods%' or name ilike '%audífon%' or name ilike '%auricular%');
update public.products set category = 'Cargadores/Cables'
  where profile_type = 'celulares' and (name ilike '%cargador%' or name ilike '%cable%');
update public.products set category = 'Cases/Fundas'
  where profile_type = 'celulares' and (name ilike '%forro%' or name ilike '%funda%' or name ilike '%case%');
update public.products set category = 'Accesorios'
  where profile_type = 'celulares' and category = 'Accesorio';

-- ── Electrónicas ─────────────────────────────────────────────────
update public.products set category = 'Laptops/Computadoras'
  where profile_type = 'electronicas' and category in ('Laptop', 'Computadora');
update public.products set category = 'TVs/Smart TV'
  where profile_type = 'electronicas' and category in ('Televisor', 'TV');
update public.products set category = 'Consolas'
  where profile_type = 'electronicas' and category = 'Consola';
update public.products set category = 'Monitores'
  where profile_type = 'electronicas' and category = 'Monitor';
update public.products set category = 'Impresoras'
  where profile_type = 'electronicas' and category = 'Impresora';
update public.products set category = 'Sonido/Bocinas'
  where profile_type = 'electronicas' and category in ('Audio', 'Bocina');

-- ── Reconstruir category_brands desde los productos corregidos ───
delete from public.category_brands;
insert into public.category_brands (profile_type, category_name, brand_name)
  select distinct profile_type, category, brand from public.products where active
  on conflict do nothing;
-- Riqueza: todas las marcas de smartphones bajo "Smartphones".
insert into public.category_brands (profile_type, category_name, brand_name)
  select 'celulares', 'Smartphones', name from unnest(array[
    'Apple','Samsung','Xiaomi','Motorola','Huawei','Honor','Tecno','Infinix',
    'Realme','OnePlus','Google Pixel','ZTE'
  ]) as t(name)
  on conflict do nothing;
