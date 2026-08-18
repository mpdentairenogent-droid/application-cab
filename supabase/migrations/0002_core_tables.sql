-- Tables cœur : identité du cabinet, praticiens, profils, permissions granulaires

create table if not exists public.app_settings (
  id smallint primary key default 1,
  cabinet_name text not null default 'Mon cabinet dentaire',
  logo_url text,
  address text,
  phone text,
  email text,
  primary_color text not null default '#7C9885',
  secondary_color text not null default '#5B7C99',
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.practitioners (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  color text not null default '#7C9885',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  avatar_url text,
  role app_role not null,
  status profile_status not null default 'active',
  practitioner_id uuid references public.practitioners (id) on delete set null,
  phone text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_practitioner_idx on public.profiles (practitioner_id);

create table if not exists public.permissions (
  code text primary key,
  description text not null,
  category text not null
);

create table if not exists public.role_permissions (
  role app_role not null,
  permission_code text not null references public.permissions (code) on delete cascade,
  primary key (role, permission_code)
);

create table if not exists public.user_permissions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  permission_code text not null references public.permissions (code) on delete cascade,
  granted boolean not null,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  primary key (user_id, permission_code)
);

comment on table public.user_permissions is 'Dérogations par utilisateur : granted=true ajoute une permission absente du rôle, granted=false retire une permission par défaut du rôle.';
