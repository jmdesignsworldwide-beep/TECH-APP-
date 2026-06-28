-- ════════════════════════════════════════════════════════════════
-- JM TECH — TANDA 9A: GARANTÍAS + PEDIDOS + REPARACIONES (poblado premium)
-- Migración 0010 — Módulos del "después de la venta", separados por perfil.
-- Poblados y navegables; operación liviana (demo de ventas), no profunda.
--
--   • warranties — se EXTIENDE (ya existe): perfil, número, serie/IMEI,
--     vendedor, y flujo simple de reclamo. "Por vencer" se DERIVA (no es estado).
--   • orders     — se EXTIENDE (ya existe): qué encargó, adelanto, proveedor,
--     estados llegó/entregado, e historial de estado.
--   • repairs    — NUEVA: orden de servicio por perfil (IMEI cel / serie elec),
--     presupuesto, técnico, estado e historial.
--
-- RLS + FORCE en lo nuevo. Lectura autenticada; escritura solo admin/owner.
-- No toca caja ni descuenta inventario: eso es producción.
-- ════════════════════════════════════════════════════════════════

-- ── Extender warranties ──────────────────────────────────────────
alter table public.warranties
  add column if not exists profile_type     profile_type,
  add column if not exists warranty_number  text,
  add column if not exists serial           text,           -- IMEI / nº de serie
  add column if not exists seller_name      text,
  add column if not exists claim_reason     text,
  add column if not exists claim_resolution text,            -- cambio/reparación/devolución
  add column if not exists claimed_at       timestamptz;

-- Backfill del perfil desde el producto para filas viejas.
update public.warranties w
  set profile_type = p.profile_type
  from public.products p
  where w.product_id = p.id and w.profile_type is null;

create index if not exists warranties_profile_idx on public.warranties (profile_type, status);

-- ── Extender orders ──────────────────────────────────────────────
alter table public.orders
  add column if not exists item_desc      text,
  add column if not exists deposit        numeric(12,2) not null default 0 check (deposit >= 0),
  add column if not exists supplier       text,
  add column if not exists status_history jsonb not null default '[]'::jsonb;

-- Ampliar estados: añade llegó/entregado conservando los previos (el Dashboard
-- sigue contando pendiente/en_proceso como pendientes).
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pendiente','en_proceso','llego','entregado','completado','cancelado'));

-- ── Tabla nueva: repairs (servicio técnico por perfil) ───────────
create table if not exists public.repairs (
  id             uuid primary key default gen_random_uuid(),
  profile_type   profile_type not null,
  order_number   text not null,
  customer_id    uuid references public.customers (id) on delete set null,
  customer_name  text,                       -- snapshot legible
  device         text not null,              -- equipo
  identifier     text,                       -- IMEI (cel) / nº de serie (elec)
  problem        text,
  budget         numeric(12,2) not null default 0 check (budget >= 0),
  technician     text,
  status         text not null default 'recibido'
                 check (status in ('recibido','en_revision','diagnosticando','reparando','listo','entregado','cancelado')),
  status_history jsonb not null default '[]'::jsonb,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists repairs_profile_idx on public.repairs (profile_type, status);

drop trigger if exists trg_repairs_updated on public.repairs;
create trigger trg_repairs_updated
  before update on public.repairs
  for each row execute function public.set_updated_at();

-- ── RLS + FORCE (repairs) ────────────────────────────────────────
alter table public.repairs enable row level security;
alter table public.repairs force  row level security;
drop policy if exists repairs_read on public.repairs;
create policy repairs_read on public.repairs
  for select to authenticated using (true);
drop policy if exists repairs_admin_write on public.repairs;
create policy repairs_admin_write on public.repairs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- SEMILLA — datos dominicanos creíbles por tienda. Idempotente.
-- ════════════════════════════════════════════════════════════════
do $$
declare
  custs uuid[];
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid;
begin
  select array_agg(id) into custs from (select id from customers order by created_at, full_name limit 10) s;
  if custs is null or array_length(custs,1) is null then return; end if;
  c1 := custs[1]; c2 := custs[1 + (1 % greatest(array_length(custs,1),1))];
  c3 := custs[1 + (2 % array_length(custs,1))]; c4 := custs[1 + (3 % array_length(custs,1))];
  c5 := custs[1 + (4 % array_length(custs,1))]; c6 := custs[1 + (5 % array_length(custs,1))];

  -- ── GARANTÍAS (reseed solo si aún no hay numeradas) ──
  if not exists (select 1 from warranties where warranty_number is not null) then
    insert into warranties (profile_type, product_id, customer_id, months, starts_at, expires_at, status,
                            warranty_number, serial, seller_name, claim_reason, claim_resolution, claimed_at)
    values
      -- Celulares
      ('celulares', (select id from products where profile_type='celulares' order by random() limit 1), c1, 12,
        current_date - 20, current_date + 345, 'vigente', 'GAR-CEL-001', '356938035643809', 'Wandy Manuel Ureña', null, null, null),
      ('celulares', (select id from products where profile_type='celulares' order by random() limit 1), c2, 12,
        current_date - 350, current_date + 15, 'vigente', 'GAR-CEL-002', '356938035643810', 'Estarlin de Jesús Pérez', null, null, null),  -- por vencer
      ('celulares', (select id from products where profile_type='celulares' order by random() limit 1), c3, 6,
        current_date - 200, current_date + 8, 'vigente', 'GAR-CEL-003', '356938035643811', 'Wandy Manuel Ureña', null, null, null),  -- por vencer
      ('celulares', (select id from products where profile_type='celulares' order by random() limit 1), c4, 12,
        current_date - 400, current_date - 35, 'vencida', 'GAR-CEL-004', '356938035643812', 'Estarlin de Jesús Pérez', null, null, null),
      ('celulares', (select id from products where profile_type='celulares' order by random() limit 1), c5, 12,
        current_date - 120, current_date + 245, 'reclamada', 'GAR-CEL-005', '356938035643813', 'Wandy Manuel Ureña',
        'Pantalla con líneas verdes', 'cambio', now() - interval '10 days'),
      ('celulares', (select id from products where profile_type='celulares' order by random() limit 1), c6, 12,
        current_date - 5, current_date + 360, 'vigente', 'GAR-CEL-006', '356938035643814', 'Massiel Carolina Abreu', null, null, null),
      -- Electrónicas
      ('electronicas', (select id from products where profile_type='electronicas' order by random() limit 1), c2, 24,
        current_date - 30, current_date + 700, 'vigente', 'GAR-ELE-001', 'SN-LG-9920341', 'Yefri Alexander Núñez', null, null, null),
      ('electronicas', (select id from products where profile_type='electronicas' order by random() limit 1), c3, 12,
        current_date - 355, current_date + 10, 'vigente', 'GAR-ELE-002', 'SN-SONY-771182', 'Geraldine Mercedes Lora', null, null, null),  -- por vencer
      ('electronicas', (select id from products where profile_type='electronicas' order by random() limit 1), c4, 12,
        current_date - 410, current_date - 45, 'vencida', 'GAR-ELE-003', 'SN-HP-5512093', 'Yefri Alexander Núñez', null, null, null),
      ('electronicas', (select id from products where profile_type='electronicas' order by random() limit 1), c5, 12,
        current_date - 90, current_date + 275, 'reclamada', 'GAR-ELE-004', 'SN-EPSON-220045', 'Geraldine Mercedes Lora',
        'No enciende tras 2 meses', 'reparación', now() - interval '6 days'),
      ('electronicas', (select id from products where profile_type='electronicas' order by random() limit 1), c1, 24,
        current_date - 2, current_date + 728, 'vigente', 'GAR-ELE-005', 'SN-SAMS-330871', 'Franklin José Disla', null, null, null);
  end if;

  -- ── PEDIDOS (reseed solo si aún no hay con item_desc) ──
  if not exists (select 1 from orders where item_desc is not null) then
    insert into orders (profile_type, customer_id, status, total, deposit, item_desc, supplier, note, created_at, expected_at, status_history)
    values
      ('celulares', c1, 'pendiente', 89900, 30000, 'iPhone 15 Pro Max 256GB Titanio Natural', 'Importadora TecnoRD',
        'Cliente quiere el color titanio', now() - interval '2 days', now() + interval '5 days',
        jsonb_build_array(jsonb_build_object('status','pendiente','at', (now() - interval '2 days')))),
      ('celulares', c2, 'en_proceso', 62500, 25000, 'Samsung Galaxy S24 Ultra 512GB', 'Distribuidora Caribe',
        null, now() - interval '4 days', now() + interval '2 days',
        jsonb_build_array(jsonb_build_object('status','pendiente','at',(now()-interval '4 days')), jsonb_build_object('status','en_proceso','at',(now()-interval '1 days')))),
      ('celulares', c3, 'llego', 14900, 14900, 'AirPods Pro 2da Gen', 'Importadora TecnoRD',
        'Avisar al cliente que ya llegó', now() - interval '6 days', now() - interval '1 days',
        jsonb_build_array(jsonb_build_object('status','pendiente','at',(now()-interval '6 days')), jsonb_build_object('status','en_proceso','at',(now()-interval '3 days')), jsonb_build_object('status','llego','at',(now()-interval '1 days')))),
      ('celulares', c4, 'entregado', 12900, 12900, 'Samsung Galaxy A15 128GB', 'Distribuidora Caribe',
        null, now() - interval '12 days', now() - interval '6 days',
        jsonb_build_array(jsonb_build_object('status','pendiente','at',(now()-interval '12 days')), jsonb_build_object('status','llego','at',(now()-interval '7 days')), jsonb_build_object('status','entregado','at',(now()-interval '6 days')))),
      ('electronicas', c5, 'pendiente', 145000, 50000, 'Smart TV LG OLED 65" C4', 'Mayorista Electro Santo Domingo',
        'Entrega a domicilio en Santiago', now() - interval '1 days', now() + interval '8 days',
        jsonb_build_array(jsonb_build_object('status','pendiente','at',(now()-interval '1 days')))),
      ('electronicas', c6, 'en_proceso', 38900, 15000, 'PlayStation 5 Slim + 2do control', 'Importadora TecnoRD',
        null, now() - interval '5 days', now() + interval '3 days',
        jsonb_build_array(jsonb_build_object('status','pendiente','at',(now()-interval '5 days')), jsonb_build_object('status','en_proceso','at',(now()-interval '2 days')))),
      ('electronicas', c1, 'llego', 27500, 10000, 'Laptop HP Pavilion 15 i7 16GB', 'Mayorista Electro Santo Domingo',
        'Cliente pasa el viernes', now() - interval '9 days', now() - interval '2 days',
        jsonb_build_array(jsonb_build_object('status','pendiente','at',(now()-interval '9 days')), jsonb_build_object('status','en_proceso','at',(now()-interval '5 days')), jsonb_build_object('status','llego','at',(now()-interval '2 days'))));
  end if;

  -- ── REPARACIONES (nueva tabla; reseed si vacía) ──
  if not exists (select 1 from repairs) then
    insert into repairs (profile_type, order_number, customer_id, customer_name, device, identifier, problem, budget, technician, status, status_history, created_at)
    values
      -- Celulares (IMEI)
      ('celulares','REP-CEL-1001', c1, 'José Manuel Polanco', 'iPhone 13', '356938035111001', 'No carga, posible pin de carga dañado', 3500, 'Ramón "El Técnico" Castillo', 'recibido',
        jsonb_build_array(jsonb_build_object('status','recibido','at',(now()-interval '1 days'))), now() - interval '1 days'),
      ('celulares','REP-CEL-1002', c2, 'María Altagracia Reyes', 'Samsung Galaxy S22', '356938035111002', 'Pantalla rota, cambio de display', 6800, 'Ramón "El Técnico" Castillo', 'en_revision',
        jsonb_build_array(jsonb_build_object('status','recibido','at',(now()-interval '3 days')), jsonb_build_object('status','en_revision','at',(now()-interval '2 days'))), now() - interval '3 days'),
      ('celulares','REP-CEL-1003', c3, 'Ramón Emilio Castillo', 'Xiaomi Redmi Note 12', '356938035111003', 'Se apaga solo, revisar batería', 2400, 'Anyelo Reparaciones', 'reparando',
        jsonb_build_array(jsonb_build_object('status','recibido','at',(now()-interval '5 days')), jsonb_build_object('status','en_revision','at',(now()-interval '4 days')), jsonb_build_object('status','reparando','at',(now()-interval '2 days'))), now() - interval '5 days'),
      ('celulares','REP-CEL-1004', c4, 'Yokasta Fernández', 'iPhone 12', '356938035111004', 'No da señal, cambio de antena', 4200, 'Ramón "El Técnico" Castillo', 'listo',
        jsonb_build_array(jsonb_build_object('status','recibido','at',(now()-interval '7 days')), jsonb_build_object('status','reparando','at',(now()-interval '4 days')), jsonb_build_object('status','listo','at',(now()-interval '1 days'))), now() - interval '7 days'),
      ('celulares','REP-CEL-1005', c5, 'Wellington Peña', 'Motorola Moto G84', '356938035111005', 'Cámara trasera no enfoca', 1800, 'Anyelo Reparaciones', 'entregado',
        jsonb_build_array(jsonb_build_object('status','recibido','at',(now()-interval '14 days')), jsonb_build_object('status','listo','at',(now()-interval '9 days')), jsonb_build_object('status','entregado','at',(now()-interval '8 days'))), now() - interval '14 days'),
      -- Electrónicas (serie)
      ('electronicas','REP-ELE-2001', c2, 'María Altagracia Reyes', 'Smart TV Samsung 55"', 'SN-SAMS-TV-88120', 'No enciende, fuente de poder', 5500, 'Franklin Diagnóstico', 'recibido',
        jsonb_build_array(jsonb_build_object('status','recibido','at',(now()-interval '2 days'))), now() - interval '2 days'),
      ('electronicas','REP-ELE-2002', c3, 'Ramón Emilio Castillo', 'PlayStation 5', 'SN-PS5-552201', 'Se sobrecalienta y se apaga', 4800, 'Franklin Diagnóstico', 'diagnosticando',
        jsonb_build_array(jsonb_build_object('status','recibido','at',(now()-interval '4 days')), jsonb_build_object('status','diagnosticando','at',(now()-interval '3 days'))), now() - interval '4 days'),
      ('electronicas','REP-ELE-2003', c4, 'Yokasta Fernández', 'Laptop HP Pavilion', 'SN-HP-LAP-33019', 'No da video, posible GPU', 7200, 'Servicio Técnico Bonao', 'reparando',
        jsonb_build_array(jsonb_build_object('status','recibido','at',(now()-interval '6 days')), jsonb_build_object('status','diagnosticando','at',(now()-interval '5 days')), jsonb_build_object('status','reparando','at',(now()-interval '3 days'))), now() - interval '6 days'),
      ('electronicas','REP-ELE-2004', c5, 'Wellington Peña', 'Monitor LG 27"', 'SN-LG-MON-77450', 'Píxeles muertos, cambio de panel', 3900, 'Franklin Diagnóstico', 'listo',
        jsonb_build_array(jsonb_build_object('status','recibido','at',(now()-interval '8 days')), jsonb_build_object('status','reparando','at',(now()-interval '4 days')), jsonb_build_object('status','listo','at',(now()-interval '1 days'))), now() - interval '8 days');
  end if;
end $$;
