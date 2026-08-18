-- Tâches, Post-it, communication interne

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  responsible_id uuid references public.profiles (id) on delete set null,
  assigned_role app_role,
  assigned_to_all boolean not null default false,
  due_date date,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_due_date_idx on public.tasks (due_date);

create table if not exists public.task_assignments (
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (task_id, user_id)
);

create table if not exists public.post_its (
  id uuid primary key default gen_random_uuid(),
  title text,
  body text not null,
  author_id uuid references public.profiles (id) on delete set null,
  recipient_type text not null default 'team' check (recipient_type in ('user', 'role', 'team')),
  recipient_user_id uuid references public.profiles (id) on delete cascade,
  recipient_role app_role,
  color text not null default '#FDE9C8',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_date date,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists post_its_recipient_idx on public.post_its (recipient_type, recipient_role, recipient_user_id);

create table if not exists public.internal_messages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_id uuid references public.profiles (id) on delete set null,
  audience_type text not null default 'team' check (audience_type in ('team', 'role')),
  audience_role app_role,
  requires_acknowledgement boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.message_acknowledgements (
  message_id uuid not null references public.internal_messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
