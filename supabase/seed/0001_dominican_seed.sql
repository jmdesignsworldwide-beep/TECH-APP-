-- ════════════════════════════════════════════════════════════════
-- JM TECH — SEMILLA DOMINICANA (Tanda 2)
-- Datos creíbles para que el Dashboard respire: productos de ambos perfiles,
-- clientes dominicanos, ventas de los últimos 7 días (con más HOY), bajo stock,
-- pedidos pendientes y garantías por vencer. Montos en RD$, ITBIS 18% incluido.
--
-- Idempotente: limpia las tablas de demo y vuelve a sembrar.
-- Re-ejecutable sin duplicar. NO toca app_users ni system_settings.
-- ════════════════════════════════════════════════════════════════

truncate table sale_items, sales, warranties, orders, products, customers
  restart identity cascade;

-- ── Clientes (nombres dominicanos, teléfonos 809/829/849) ────────
insert into public.customers (full_name, phone) values
  ('José Manuel Polanco',   '809-555-0142'),
  ('María Altagracia Reyes','829-555-0188'),
  ('Ramón Emilio Castillo', '849-555-0123'),
  ('Yokasta Fernández',     '809-555-0177'),
  ('Wellington Peña',       '829-555-0199'),
  ('Anyelina Jiménez',      '849-555-0166'),
  ('Francisco Alberto Mejía','809-555-0155'),
  ('Rosanna Bautista',      '829-555-0133'),
  ('Junior de la Cruz',     '849-555-0111'),
  ('Carolina Santana',      '809-555-0144');

-- ── Productos: CELULARES (precios RD$ creíbles) ──────────────────
insert into public.products (profile_type, name, brand, category, sku, price, cost, stock, min_stock) values
  ('celulares','iPhone 15 Pro Max 256GB','Apple','Smartphone','CEL-IP15PM-256', 89900, 74000, 6, 4),
  ('celulares','iPhone 15 128GB','Apple','Smartphone','CEL-IP15-128', 62500, 51000, 9, 4),
  ('celulares','iPhone 13 128GB','Apple','Smartphone','CEL-IP13-128', 41900, 33500, 3, 5),   -- bajo stock
  ('celulares','Samsung Galaxy S24 Ultra','Samsung','Smartphone','CEL-SGS24U', 78500, 64000, 5, 4),
  ('celulares','Samsung Galaxy A15','Samsung','Smartphone','CEL-SGA15', 12900, 9500, 14, 6),
  ('celulares','Xiaomi Redmi Note 13 Pro','Xiaomi','Smartphone','CEL-XRN13P', 18900, 14200, 2, 5),  -- bajo stock
  ('celulares','Motorola Moto G84','Motorola','Smartphone','CEL-MG84', 14500, 10800, 11, 6),
  ('celulares','AirPods Pro 2da Gen','Apple','Accesorio','CEL-APP2', 14900, 11000, 8, 5),
  ('celulares','Cargador USB-C 30W','Anker','Accesorio','CEL-ANK30', 1850, 1100, 4, 10),     -- bajo stock
  ('celulares','Forro iPhone 15 Pro Max','Spigen','Accesorio','CEL-SPG15PM', 1290, 650, 25, 8);

-- ── Productos: ELECTRÓNICAS (precios RD$ creíbles) ───────────────
insert into public.products (profile_type, name, brand, category, sku, price, cost, stock, min_stock) values
  ('electronicas','MacBook Air M2 13"','Apple','Laptop','ELE-MBAM2', 74900, 61000, 4, 3),
  ('electronicas','Laptop Dell Inspiron 15','Dell','Laptop','ELE-DELL15', 38900, 31000, 7, 4),
  ('electronicas','Laptop HP Pavilion 14','HP','Laptop','ELE-HP14', 33500, 26500, 2, 4),       -- bajo stock
  ('electronicas','Smart TV LG 55" 4K','LG','Televisor','ELE-LGTV55', 36900, 29000, 5, 3),
  ('electronicas','Smart TV Samsung 65" QLED','Samsung','Televisor','ELE-SSTV65', 58900, 47000, 3, 3),
  ('electronicas','PlayStation 5 Slim','Sony','Consola','ELE-PS5S', 32900, 27000, 6, 4),
  ('electronicas','Xbox Series X','Microsoft','Consola','ELE-XBSX', 31500, 25800, 1, 3),        -- bajo stock
  ('electronicas','Monitor Samsung 27" 144Hz','Samsung','Monitor','ELE-SM27', 14900, 11200, 9, 5),
  ('electronicas','Impresora Epson EcoTank','Epson','Impresora','ELE-EPSET', 13900, 10500, 8, 5),
  ('electronicas','Bocina JBL Charge 5','JBL','Audio','ELE-JBLC5', 8900, 6400, 3, 6);            -- bajo stock

-- ── Ventas de los últimos 7 días (más HOY), con líneas e ITBIS ──
do $$
declare
  v_day      int;
  v_count    int;
  v_i        int;
  v_sale     uuid;
  v_cust     uuid;
  v_total    numeric(12,2);
  v_item     record;
  v_qty      int;
  v_profiles profile_type[] := array['celulares','electronicas']::profile_type[];
  v_p        profile_type;
  v_methods  text[] := array['efectivo','tarjeta','transferencia'];
begin
  for v_day in 0..6 loop
    foreach v_p in array v_profiles loop
      -- Hoy concentra más ventas (la estrella del Dashboard).
      v_count := case when v_day = 0 then 7 else 3 + (v_day % 3) end;

      for v_i in 1..v_count loop
        select id into v_cust from public.customers order by random() limit 1;

        insert into public.sales (profile_type, customer_id, payment_method, sold_at, subtotal, itbis, total)
        values (
          v_p, v_cust,
          v_methods[1 + floor(random() * 3)::int],
          -- Hoy: entre medianoche y ahora (nunca cae en ayer, sea la hora que
          -- sea). Días pasados: repartido dentro de ese día.
          case when v_day = 0
            then date_trunc('day', now())
                 + (random() * extract(epoch from (now() - date_trunc('day', now()))))::int * interval '1 second'
            else date_trunc('day', now()) - (v_day || ' days')::interval
                 + (floor(random() * 15))::int * interval '1 hour'
                 + (floor(random() * 60))::int * interval '1 minute'
          end,
          0, 0, 0
        )
        returning id into v_sale;

        v_total := 0;
        -- 1 a 2 productos del perfil correspondiente.
        for v_item in
          select id, price from public.products
          where profile_type = v_p
          order by random()
          limit 1 + floor(random() * 2)::int
        loop
          v_qty := 1 + floor(random() * 2)::int;
          insert into public.sale_items (sale_id, product_id, qty, unit_price, line_total)
          values (v_sale, v_item.id, v_qty, v_item.price, v_item.price * v_qty);
          v_total := v_total + v_item.price * v_qty;
        end loop;

        -- Precios al público con ITBIS incluido: desglosamos el 18%.
        update public.sales set
          total    = v_total,
          subtotal = round(v_total / 1.18, 2),
          itbis    = round(v_total - (v_total / 1.18), 2)
        where id = v_sale;
      end loop;
    end loop;
  end loop;
end $$;

-- ── Pedidos pendientes (con algunos en proceso) ──────────────────
insert into public.orders (profile_type, customer_id, status, total, note, created_at, expected_at)
select
  p.profile_type,
  (select id from public.customers order by random() limit 1),
  s.status,
  p.price * s.qty,
  s.note,
  now() - (s.age_days || ' days')::interval,
  now() + (s.eta_days || ' days')::interval
from (values
  ('CEL-IP15PM-256','pendiente',1,'Encargo cliente — color titanio', 1, 3),
  ('ELE-PS5S','pendiente',2,'Reservadas para fin de semana', 0, 2),
  ('CEL-SGS24U','en_proceso',1,'Pago en transferencia confirmado', 2, 1),
  ('ELE-LGTV55','pendiente',1,'Entrega a domicilio Santiago', 1, 4),
  ('CEL-XRN13P','pendiente',3,'Lote para revendedor', 0, 5)
) as s(sku, status, qty, note, age_days, eta_days)
join public.products p on p.sku = s.sku;

-- ── Garantías: varias por vencer dentro de 30 días ───────────────
insert into public.warranties (product_id, customer_id, sale_id, months, starts_at, expires_at, status)
select
  p.id,
  (select id from public.customers order by random() limit 1),
  null,
  w.months,
  (current_date - (w.months * 30 - w.days_left)),
  (current_date + w.days_left),
  'vigente'
from (values
  ('CEL-IP15PM-256', 12, 6),
  ('CEL-SGS24U',     12, 12),
  ('ELE-MBAM2',      12, 3),
  ('ELE-PS5S',       6,  18),
  ('ELE-SSTV65',     24, 25),
  ('CEL-IP13-128',   12, 45),   -- esta NO está por vencer (control)
  ('ELE-DELL15',     12, 9)
) as w(sku, months, days_left)
join public.products p on p.sku = w.sku;
