-- Équipements, maintenance, pannes, stérilisation

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  brand text,
  model text,
  serial_number text,
  purchase_date date,
  installation_date date,
  warranty_until date,
  supplier_id uuid references public.suppliers (id) on delete set null,
  maintenance_company text,
  maintenance_phone text,
  last_maintenance_date date,
  next_maintenance_date date,
  status text not null default 'functional' check (
    status in ('functional', 'to_monitor', 'broken', 'maintenance_in_progress', 'out_of_service')
  ),
  qr_code text unique,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger equipment_set_updated_at before update on public.equipment
  for each row execute function public.set_updated_at();

create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment (id) on delete cascade,
  performed_at date not null default current_date,
  performed_by uuid references public.profiles (id) on delete set null,
  description text,
  cost numeric(10, 2),
  next_due_date date,
  created_at timestamptz not null default now()
);

-- Garde equipment.last/next_maintenance_date synchronisés avec l'historique,
-- pour éviter d'avoir à recalculer ces deux colonnes côté client à chaque écran.
create or replace function public.sync_equipment_maintenance_dates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.equipment
  set last_maintenance_date = new.performed_at,
      next_maintenance_date = new.next_due_date
  where id = new.equipment_id
    and (last_maintenance_date is null or last_maintenance_date <= new.performed_at);
  return new;
end;
$$;

create or replace trigger maintenance_records_sync_equipment after insert on public.maintenance_records
  for each row execute function public.sync_equipment_maintenance_dates();

create table if not exists public.breakdowns (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references public.equipment (id) on delete set null,
  description text not null,
  reported_by uuid references public.profiles (id) on delete set null,
  urgency text not null default 'normal' check (urgency in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'reported' check (
    status in ('reported', 'technician_to_contact', 'technician_contacted', 'intervention_scheduled', 'in_repair', 'resolved')
  ),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.sterilization_cycles (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references public.equipment (id) on delete set null,
  cycle_number text,
  program text,
  performed_by uuid references public.profiles (id) on delete set null,
  batch_number text,
  result text not null default 'conforming' check (result in ('conforming', 'non_conforming')),
  comment text,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists sterilization_cycles_performed_at_idx on public.sterilization_cycles (performed_at desc);

create table if not exists public.sterilization_incidents (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.sterilization_cycles (id) on delete cascade,
  description text not null,
  corrective_action text,
  reported_by uuid references public.profiles (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create table if not exists public.sterilization_incident_notifications (
  incident_id uuid not null references public.sterilization_incidents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (incident_id, user_id)
);

create table if not exists public.sterilization_controls (
  id uuid primary key default gen_random_uuid(),
  control_type text not null check (
    control_type in ('bowie_dick', 'helix', 'penetration_test', 'quality_control', 'filter_change', 'maintenance', 'periodic')
  ),
  equipment_id uuid references public.equipment (id) on delete set null,
  performed_by uuid references public.profiles (id) on delete set null,
  performed_at date not null default current_date,
  result text check (result in ('pass', 'fail')),
  next_due_date date,
  comment text,
  created_at timestamptz not null default now()
);
