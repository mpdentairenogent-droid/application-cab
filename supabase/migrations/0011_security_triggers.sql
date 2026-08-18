-- Triggers de sécurité : empêchent une élévation de privilège même via un
-- appel API direct, et journalisent les changements sensibles.

-- Un utilisateur peut modifier son propre profil (avatar, téléphone...) mais
-- jamais son propre rôle/statut/praticien associé sans la permission manage_users
-- — sinon un utilisateur pourrait s'auto-promouvoir en modifiant directement la ligne.
--
-- Pas de SECURITY DEFINER ici : cette fonction n'a besoin d'aucun privilège
-- élevé (has_permission() gère déjà sa propre élévation), et on a justement
-- besoin que current_user / auth.uid() reflètent le VRAI appelant — un
-- SECURITY DEFINER bascule current_user sur le propriétaire de la fonction
-- pendant son exécution, ce qui masquerait qui fait réellement la requête.
--
-- auth.uid() est NULL uniquement pour les contextes de confiance qui ne
-- portent pas de JWT applicatif (service_role, migrations) : un utilisateur
-- "authenticated" a toujours un uid. Ça laisse passer sans vérification les
-- scripts d'administration (ex. scripts/seed-demo.ts) qui n'ont justement
-- pas à être soumis aux permissions d'un utilisateur applicatif.
create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if (new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.practitioner_id is distinct from old.practitioner_id)
     and not public.has_permission('manage_users') then
    raise exception 'Modification du rôle, du statut ou du praticien associé réservée aux comptes disposant de la permission manage_users.';
  end if;
  return new;
end;
$$;

create or replace trigger profiles_guard_sensitive_fields before update on public.profiles
  for each row execute function public.guard_profile_sensitive_fields();

create or replace function public.audit_profile_sensitive_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role or old.status is distinct from new.status then
    perform public.log_audit_event(
      'update',
      'profiles',
      new.id,
      jsonb_build_object('role', old.role, 'status', old.status),
      jsonb_build_object('role', new.role, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

create or replace trigger profiles_audit_sensitive_changes after update on public.profiles
  for each row execute function public.audit_profile_sensitive_changes();

-- Données financières : chaque changement compte. Ces deux tables ont une
-- colonne "id" classique, le trigger générique convient tel quel.
create or replace trigger revenue_entries_audit after insert or update or delete on public.revenue_entries
  for each row execute function public.audit_table_change();

create or replace trigger expenses_audit after insert or update or delete on public.expenses
  for each row execute function public.audit_table_change();

-- user_permissions a une clé composite (user_id, permission_code), pas de
-- colonne "id" : audit_table_change() ne s'applique pas telle quelle. On
-- journalise plutôt sous l'entité "user_permissions" avec le profil
-- concerné comme entity_id, ce qui est aussi plus utile à l'usage (retrouver
-- l'historique des dérogations d'un utilisateur donné).
create or replace function public.audit_user_permission_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.log_audit_event('delete', 'user_permissions', old.user_id,
      jsonb_build_object('permission_code', old.permission_code, 'granted', old.granted), null);
    return old;
  else
    perform public.log_audit_event(
      case when tg_op = 'INSERT' then 'create' else 'update' end,
      'user_permissions',
      new.user_id,
      case when tg_op = 'UPDATE' then jsonb_build_object('permission_code', old.permission_code, 'granted', old.granted) else null end,
      jsonb_build_object('permission_code', new.permission_code, 'granted', new.granted)
    );
    return new;
  end if;
end;
$$;

create or replace trigger user_permissions_audit after insert or update or delete on public.user_permissions
  for each row execute function public.audit_user_permission_change();
