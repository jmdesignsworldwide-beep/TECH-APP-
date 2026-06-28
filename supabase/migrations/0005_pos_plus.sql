-- ════════════════════════════════════════════════════════════════
-- JM TECH — TANDA 4.5: MEJORA POS
-- Migración 0005 — Soporte para cliente en la venta (cédula) e imagen de
-- producto (cableado para fotos futuras). Sin tablas nuevas: extiende lo
-- existente. RLS+FORCE ya vigentes en customers/products.
-- ════════════════════════════════════════════════════════════════

alter table public.customers
  add column if not exists cedula text;

alter table public.products
  add column if not exists image_url text;

-- Backfill de cédulas dominicanas de ejemplo (formato 000-0000000-0) para los
-- clientes ya sembrados que no tengan. Determinista por nombre.
update public.customers set cedula =
  lpad((abs(hashtext(full_name)) % 3 + 1)::text, 3, '0') || '-' ||
  lpad((abs(hashtext(full_name)) % 9000000 + 1000000)::text, 7, '0') || '-' ||
  ((abs(hashtext(full_name)) % 9) + 1)::text
where cedula is null;
