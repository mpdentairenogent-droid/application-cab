-- Chiffre d'affaires, objectifs, dépenses : les tables les plus sensibles du
-- projet. Isolation stricte appliquée au niveau RLS (0013_rls_finance.sql),
-- jamais seulement côté interface.

create table if not exists public.revenue_entries (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners (id) on delete cascade,
  entry_date date not null,
  amount numeric(10, 2) not null,
  worked_day boolean not null default true,
  patient_count integer,
  comment text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (practitioner_id, entry_date)
);

create index if not exists revenue_entries_practitioner_date_idx on public.revenue_entries (practitioner_id, entry_date desc);

create table if not exists public.financial_targets (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid references public.practitioners (id) on delete cascade,
  period_type text not null check (period_type in ('daily', 'monthly', 'yearly')),
  period_start date not null,
  target_amount numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  unique (practitioner_id, period_type, period_start)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  amount numeric(10, 2) not null,
  supplier_id uuid references public.suppliers (id) on delete set null,
  category text not null check (
    category in ('consumables', 'equipment', 'laboratory', 'staff', 'maintenance', 'it', 'rent', 'insurance', 'subscription', 'other')
  ),
  payment_method text,
  comment text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_date_idx on public.expenses (expense_date desc);
