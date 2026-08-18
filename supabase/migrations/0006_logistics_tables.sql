-- Fournisseurs, demandes de matériel, commandes, stock

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  sales_rep_name text,
  phone text,
  email text,
  address text,
  website text,
  client_reference text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.material_requests (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  category text,
  quantity integer not null default 1 check (quantity > 0),
  requested_by uuid references public.profiles (id) on delete set null,
  urgency text not null default 'normal' check (urgency in ('low', 'normal', 'high', 'urgent')),
  comment text,
  supplier_id uuid references public.suppliers (id) on delete set null,
  reference text,
  estimated_price numeric(10, 2),
  status text not null default 'pending_approval' check (
    status in ('pending_approval', 'to_order', 'ordered', 'partially_received', 'received', 'rejected')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger material_requests_set_updated_at before update on public.material_requests
  for each row execute function public.set_updated_at();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers (id) on delete set null,
  order_number text,
  ordered_by uuid references public.profiles (id) on delete set null,
  ordered_at date not null default current_date,
  expected_delivery_date date,
  received_at date,
  status text not null default 'to_order' check (
    status in ('to_order', 'ordered', 'pending', 'partially_received', 'received', 'cancelled')
  ),
  total_amount numeric(10, 2),
  invoice_reference text,
  notes text,
  material_request_id uuid references public.material_requests (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2)
);

create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  reference text,
  quantity numeric not null default 0,
  unit text not null default 'unité',
  minimum_quantity numeric not null default 0,
  location text,
  supplier_id uuid references public.suppliers (id) on delete set null,
  unit_price numeric(10, 2),
  expiry_date date,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger stock_items_set_updated_at before update on public.stock_items
  for each row execute function public.set_updated_at();

create index if not exists stock_items_expiry_idx on public.stock_items (expiry_date);

-- "quantity" est toujours saisie en valeur positive (une magnitude) sauf pour
-- movement_type='correction' où elle porte le signe réel de l'ajustement ;
-- c'est le trigger apply_stock_movement (0012) qui applique le bon sens à
-- stock_items.quantity selon le type. Ça évite qu'un mouvement "out" saisi
-- par erreur avec un delta positif augmente le stock au lieu de le baisser.
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references public.stock_items (id) on delete cascade,
  movement_type text not null check (movement_type in ('in', 'out', 'correction', 'order_reception', 'loss', 'expired')),
  quantity numeric not null check (movement_type = 'correction' or quantity > 0),
  reason text,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_item_idx on public.stock_movements (stock_item_id);
