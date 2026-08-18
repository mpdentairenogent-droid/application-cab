-- Fonctions utilitaires utilisées par les policies RLS.
-- SECURITY DEFINER + search_path fixé : elles lisent profiles/role_permissions/
-- user_permissions en s'affranchissant du RLS appelant (sinon une policy sur
-- "profiles" qui appelle une fonction qui relit "profiles" provoquerait une
-- récursion). Elles restent "stable" pour que le planificateur les évalue une
-- seule fois par requête.

create or replace function public.my_role()
returns app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.my_practitioner_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select practitioner_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_active_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.has_permission(perm text)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_role app_role;
  v_status profile_status;
  v_override boolean;
begin
  select role, status into v_role, v_status
  from public.profiles
  where id = auth.uid();

  if v_role is null or v_status <> 'active' then
    return false;
  end if;

  select granted into v_override
  from public.user_permissions
  where user_id = auth.uid() and permission_code = perm;

  if v_override is not null then
    return v_override;
  end if;

  return exists (
    select 1 from public.role_permissions
    where role = v_role and permission_code = perm
  );
end;
$$;

-- Expose à un utilisateur connecté l'ensemble résolu de ses propres permissions
-- (rôle + dérogations), pour piloter l'UI sans jamais exposer role_permissions /
-- user_permissions bruts au client.
create or replace function public.my_permissions()
returns table (permission_code text)
language sql
security definer
set search_path = public
stable
as $$
  select p.code
  from public.permissions p
  where public.has_permission(p.code);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

grant execute on function public.my_role() to authenticated;
grant execute on function public.my_practitioner_id() to authenticated;
grant execute on function public.is_active_staff() to authenticated;
grant execute on function public.has_permission(text) to authenticated;
grant execute on function public.my_permissions() to authenticated;
