-- Laboratoires, documents/protocoles, check-lists, calendrier, absences

create table if not exists public.laboratories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  contact_name text,
  specialties text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.document_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid references public.document_categories (id) on delete set null,
  file_path text not null,
  file_type text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.document_favorites (
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (document_id, user_id)
);

create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text check (
    category in ('opening', 'closing', 'sterilization', 'room_check', 'cleaning', 'end_of_day', 'weekly_check', 'other')
  ),
  items jsonb not null default '[]',
  created_by uuid references public.profiles (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on column public.checklist_templates.items is 'Liste ordonnée [{"id": "...", "label": "..."}] : n''existe jamais indépendamment de son template, jsonb évite une table de jointure inutile.';

create table if not exists public.checklist_entries (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates (id) on delete cascade,
  completed_by uuid references public.profiles (id) on delete set null,
  completed_items jsonb not null default '[]',
  anomalies text,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.internal_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text not null default 'other' check (
    event_type in ('maintenance', 'meeting', 'training', 'control', 'delivery', 'leave', 'other')
  ),
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  related_equipment_id uuid references public.equipment (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists internal_events_starts_at_idx on public.internal_events (starts_at);

create table if not exists public.absences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  absence_type text not null default 'leave' check (absence_type in ('leave', 'training', 'sick', 'recovery', 'other')),
  start_date date not null,
  end_date date not null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected')),
  comment text,
  created_at timestamptz not null default now(),
  constraint absences_valid_range check (end_date >= start_date)
);
