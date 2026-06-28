-- ════════════════════════════════════════════════════════════════
-- JM TECH — TANDA 2: DATOS DEL DASHBOARD
-- Migración 0002 — Tablas mínimas para que los KPIs del Dashboard respiren:
-- productos (con profile_type), clientes, ventas, líneas de venta, pedidos y
-- garantías. RLS + FORCE en todas. El detalle profundo de cada módulo llega en
-- tandas futuras; aquí solo lo necesario para alimentar los indicadores.
-- ════════════════════════════════════════════════════════════════

-- ── Productos ────────────────────────────────────────────────────
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  profile_type profile_type not null,
  name         text not null,
  brand        text not null,
  category     text not null,
  sku          text unique,
  price        numeric(12,2) not null check (price >= 0),   -- RD$
  cost         numeric(12,2) not null default 0 check (cost >= 0),
  stock        integer not null default 0 check (stock >= 0),
  min_stock    integer not null default 5 check (min_stock >= 0),
  created_at   timestamptz not null default now()
);
create index if not exists products_profile_idx on public.products (profile_type);

-- ── Clientes ─────────────────────────────────────────────────────
create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  phone      text,
  created_at timestamptz not null default now()
);

-- ── Ventas ───────────────────────────────────────────────────────
create table if not exists public.sales (
  id             uuid primary key default gen_random_uuid(),
  profile_type   profile_type not null,
  customer_id    uuid references public.customers (id) on delete set null,
  subtotal       numeric(12,2) not null default 0,           -- RD$ sin ITBIS
  itbis          numeric(12,2) not null default 0,           -- ITBIS 18%
  total          numeric(12,2) not null default 0,           -- subtotal + itbis
  payment_method text not null default 'efectivo'
                 check (payment_method in ('efectivo','tarjeta','transferencia')),
  sold_at        timestamptz not null default now(),
  created_at     timestamptz not null default now()
);
create index if not exists sales_profile_idx on public.sales (profile_type);
create index if not exists sales_sold_at_idx on public.sales (sold_at);

-- ── Líneas de venta ──────────────────────────────────────────────
create table if not exists public.sale_items (
  id         uuid primary key default gen_random_uuid(),
  sale_id    uuid not null references public.sales (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  qty        integer not null default 1 check (qty > 0),
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0
);
create index if not exists sale_items_sale_idx on public.sale_items (sale_id);
create index if not exists sale_items_product_idx on public.sale_items (product_id);

-- ── Pedidos ──────────────────────────────────────────────────────
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  profile_type profile_type not null,
  customer_id  uuid references public.customers (id) on delete set null,
  status       text not null default 'pendiente'
               check (status in ('pendiente','en_proceso','completado','cancelado')),
  total        numeric(12,2) not null default 0,
  note         text,
  created_at   timestamptz not null default now(),
  expected_at  timestamptz
);
create index if not exists orders_status_idx on public.orders (status);

-- ── Garantías ────────────────────────────────────────────────────
create table if not exists public.warranties (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references public.products (id) on delete set null,
  customer_id uuid references public.customers (id) on delete set null,
  sale_id     uuid references public.sales (id) on delete set null,
  months      integer not null default 12,
  starts_at   date not null default current_date,
  expires_at  date not null,
  status      text not null default 'vigente'
              check (status in ('vigente','vencida','reclamada'))
);
create index if not exists warranties_expires_idx on public.warranties (expires_at);

-- ════════════════════════════════════════════════════════════════
-- RLS + FORCE en todas las tablas. Lectura para autenticados; escritura solo
-- admin/owner (helper is_admin() de la Tanda 1). Sin acceso anónimo.
-- ════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array[
    'products','customers','sales','sale_items','orders','warranties'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force  row level security;', t);

    execute format($p$
      drop policy if exists %1$s_read on public.%1$s;
      create policy %1$s_read on public.%1$s
        for select to authenticated using (true);
    $p$, t);

    execute format($p$
      drop policy if exists %1$s_admin_write on public.%1$s;
      create policy %1$s_admin_write on public.%1$s
        for all to authenticated
        using (public.is_admin()) with check (public.is_admin());
    $p$, t);
  end loop;
end $$;
