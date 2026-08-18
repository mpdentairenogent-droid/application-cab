-- Notifications, préférences, tokens push, et journal d'audit (immuable)

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  is_urgent boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx on public.notifications (user_id, read_at);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  categories_enabled jsonb not null default '{}',
  urgent_only boolean not null default false
);

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null unique,
  platform text check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now()
);

-- Journal d'audit : uniquement alimenté par des fonctions SECURITY DEFINER /
-- triggers (voir 0011_security_triggers.sql). Aucune policy INSERT/UPDATE/DELETE
-- n'est accordée aux rôles applicatifs — voir 0015_rls_core.sql : le journal
-- est donc infalsifiable et non supprimable depuis le client, pas seulement
-- protégé pour les "utilisateurs standards".
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_old_value jsonb,
  p_new_value jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_old_value, p_new_value);
end;
$$;

-- Auditeur générique réutilisable sur n'importe quelle table possédant une
-- colonne "id" : évite de dupliquer la même logique sur chaque table sensible.
create or replace function public.audit_table_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_audit_event('create', tg_table_name, new.id, null, to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    perform public.log_audit_event('update', tg_table_name, new.id, to_jsonb(old), to_jsonb(new));
  elsif tg_op = 'DELETE' then
    perform public.log_audit_event('delete', tg_table_name, old.id, to_jsonb(old), null);
  end if;
  return coalesce(new, old);
end;
$$;
