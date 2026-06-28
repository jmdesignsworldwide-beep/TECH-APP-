-- ════════════════════════════════════════════════════════════════
-- JM TECH — TANDA 9B: CLIENTES + PROVEEDORES (+ datos para REPORTES)
-- Migración 0011 — "Personas y números". Clientes con un poco más de fondo
-- (su historial de compras se calcula de `sales`), proveedores nuevos por
-- perfil. Reportes NO necesita tablas: se calcula sobre lo que ya existe.
-- RLS + FORCE en lo nuevo. Lectura autenticada; escritura solo admin/owner.
-- ════════════════════════════════════════════════════════════════

-- ── Extender customers ───────────────────────────────────────────
alter table public.customers
  add column if not exists email        text,
  add column if not exists address      text,
  add column if not exists birthday     date,
  add column if not exists is_active    boolean not null default true,
  add column if not exists profile_type profile_type;  -- tienda donde se registró

-- Tienda principal del cliente: donde más ha comprado; si no compró, Celulares.
update public.customers c set profile_type = coalesce(
  (select s.profile_type from public.sales s
     where s.customer_id = c.id
     group by s.profile_type order by count(*) desc limit 1),
  'celulares')
where c.profile_type is null;

-- Backfill creíble (determinista por nombre) para los clientes ya sembrados.
update public.customers set
  email = coalesce(email,
    lower(regexp_replace(split_part(full_name,' ',1) || '.' || split_part(full_name,' ',2), '[^a-zA-Z.]', '', 'g'))
    || (case abs(hashtext(full_name)) % 3 when 0 then '@gmail.com' when 1 then '@hotmail.com' else '@outlook.com' end)),
  address = coalesce(address,
    (array['Calle Duarte','Av. 27 de Febrero','Calle El Sol','Av. Independencia','Calle Mella','Av. Las Carreras'])[1 + abs(hashtext(full_name)) % 6]
    || ' #' || (10 + abs(hashtext(full_name)) % 180)::text || ', '
    || (array['Santo Domingo','Santiago','La Vega','San Cristóbal','Bonao','Moca'])[1 + abs(hashtext(full_name || 'c')) % 6]),
  birthday = coalesce(birthday,
    make_date(1980 + abs(hashtext(full_name)) % 25,
              1 + abs(hashtext(full_name)) % 12,
              1 + abs(hashtext(full_name || 'b')) % 27))
where email is null or address is null or birthday is null;

create index if not exists customers_profile_idx on public.customers (profile_type, is_active);

-- ── Tabla nueva: suppliers (proveedores por perfil) ──────────────
create table if not exists public.suppliers (
  id           uuid primary key default gen_random_uuid(),
  profile_type profile_type not null,
  name         text not null,
  contact      text,                          -- persona de contacto
  phone        text,
  email        text,
  supplies     text,                          -- qué suministra
  purchases    jsonb not null default '[]'::jsonb,  -- historial de compras (muestra)
  notes        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists suppliers_profile_idx on public.suppliers (profile_type, is_active);

drop trigger if exists trg_suppliers_updated on public.suppliers;
create trigger trg_suppliers_updated
  before update on public.suppliers
  for each row execute function public.set_updated_at();

alter table public.suppliers enable row level security;
alter table public.suppliers force  row level security;
drop policy if exists suppliers_read on public.suppliers;
create policy suppliers_read on public.suppliers
  for select to authenticated using (true);
drop policy if exists suppliers_admin_write on public.suppliers;
create policy suppliers_admin_write on public.suppliers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- SEMILLA — proveedores dominicanos creíbles por tienda. Idempotente.
-- ════════════════════════════════════════════════════════════════
do $$
begin
  if not exists (select 1 from suppliers) then
    insert into suppliers (profile_type, name, contact, phone, email, supplies, purchases) values
      ('celulares','Importadora TecnoRD','Luis Manuel Pichardo','809-565-1200','ventas@tecnord.com.do','iPhone, Samsung, accesorios',
        jsonb_build_array(
          jsonb_build_object('desc','Lote 20x iPhone 15','amount',1480000,'date',(current_date-12)::text,'status','recibido'),
          jsonb_build_object('desc','50x AirPods Pro','amount',550000,'date',(current_date-5)::text,'status','recibido'),
          jsonb_build_object('desc','Lote fundas y cristales','amount',95000,'date',(current_date-2)::text,'status','en_camino'))),
      ('celulares','Distribuidora Caribe','Carmen Rosario','829-540-3344','compras@caribedist.do','Xiaomi, Motorola, cargadores',
        jsonb_build_array(
          jsonb_build_object('desc','30x Redmi Note 13','amount',420000,'date',(current_date-9)::text,'status','recibido'),
          jsonb_build_object('desc','40x Motorola G84','amount',460000,'date',(current_date-3)::text,'status','recibido'))),
      ('celulares','AccesoriosExpress SRL','Frank Disla','809-771-8890','info@accesoriosexpress.do','Fundas, cristales, cables',
        jsonb_build_array(
          jsonb_build_object('desc','Surtido de accesorios','amount',78000,'date',(current_date-7)::text,'status','recibido'))),
      ('electronicas','Mayorista Electro Santo Domingo','Pedro Ant. Guerrero','809-689-2100','ventas@electrosd.do','TV, laptops, consolas',
        jsonb_build_array(
          jsonb_build_object('desc','10x Smart TV LG OLED','amount',980000,'date',(current_date-14)::text,'status','recibido'),
          jsonb_build_object('desc','15x Laptop HP Pavilion','amount',330000,'date',(current_date-6)::text,'status','recibido'),
          jsonb_build_object('desc','8x PS5 Slim','amount',240000,'date',(current_date-1)::text,'status','en_camino'))),
      ('electronicas','Global Tech Importaciones','Anabel Reyes','829-602-7755','compras@globaltech.do','Monitores, impresoras, audio',
        jsonb_build_array(
          jsonb_build_object('desc','20x Monitor LG 27"','amount',280000,'date',(current_date-10)::text,'status','recibido'),
          jsonb_build_object('desc','12x Impresora Epson','amount',132000,'date',(current_date-4)::text,'status','recibido'))),
      ('electronicas','Sonido y Video RD','Wilkin Abreu','849-330-4567','ventas@sonidovideord.do','Bocinas, audífonos, soportes',
        jsonb_build_array(
          jsonb_build_object('desc','Lote audio Sony/JBL','amount',210000,'date',(current_date-8)::text,'status','recibido')));
  end if;
end $$;
