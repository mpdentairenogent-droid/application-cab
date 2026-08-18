-- RLS : identité, équipe, permissions.
-- Toutes les policies ciblent explicitement "authenticated" : un utilisateur
-- anonyme n'obtient jamais aucune ligne, sur aucune table de l'application.

alter table public.profiles enable row level security;
alter table public.practitioners enable row level security;
alter table public.app_settings enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_permissions enable row level security;

-- profiles : chacun voit toujours sa propre ligne (même désactivé, pour que
-- l'app puisse afficher un message clair) ; le reste de l'équipe est visible
-- à tout compte actif (noms/rôles ne sont pas des données sensibles ici).
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_active_staff());

-- Écriture : soi-même, ou manage_users pour administrer n'importe quel compte.
-- Le trigger profiles_guard_sensitive_fields empêche toute élévation de
-- privilège même sur sa propre ligne (voir 0011_security_triggers.sql).
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.has_permission('manage_users'))
  with check (id = auth.uid() or public.has_permission('manage_users'));

-- Pas de policy insert/delete : la création passe par le trigger
-- handle_new_user (SECURITY DEFINER) sur auth.users, la désactivation se fait
-- via status='inactive', jamais de suppression physique de compte.

drop policy if exists "practitioners_select" on public.practitioners;
create policy "practitioners_select" on public.practitioners
  for select to authenticated
  using (public.is_active_staff());

drop policy if exists "practitioners_manage" on public.practitioners;
create policy "practitioners_manage" on public.practitioners
  for all to authenticated
  using (public.has_permission('manage_users'))
  with check (public.has_permission('manage_users'));

drop policy if exists "app_settings_select" on public.app_settings;
create policy "app_settings_select" on public.app_settings
  for select to authenticated
  using (public.is_active_staff());

drop policy if exists "app_settings_update" on public.app_settings;
create policy "app_settings_update" on public.app_settings
  for update to authenticated
  using (public.my_role() in ('owner_dentist', 'super_admin'))
  with check (public.my_role() in ('owner_dentist', 'super_admin'));

-- Catalogue de permissions : lecture réservée à l'écran d'administration des
-- permissions. Le code des permissions disponibles n'évolue que par migration
-- (pas de policy insert/update/delete exposée au client).
drop policy if exists "permissions_select" on public.permissions;
create policy "permissions_select" on public.permissions
  for select to authenticated
  using (public.has_permission('manage_permissions'));

-- role_permissions et user_permissions : le titulaire peut ajuster les
-- permissions par défaut d'un rôle et les dérogations individuelles (§16).
-- Tout le reste de l'app lit son propre résultat déjà calculé via la fonction
-- my_permissions() plutôt que ces tables brutes.
drop policy if exists "role_permissions_select" on public.role_permissions;
create policy "role_permissions_select" on public.role_permissions
  for select to authenticated
  using (public.has_permission('manage_permissions'));

drop policy if exists "role_permissions_manage" on public.role_permissions;
create policy "role_permissions_manage" on public.role_permissions
  for all to authenticated
  using (public.has_permission('manage_permissions'))
  with check (public.has_permission('manage_permissions'));

drop policy if exists "user_permissions_select" on public.user_permissions;
create policy "user_permissions_select" on public.user_permissions
  for select to authenticated
  using (user_id = auth.uid() or public.has_permission('manage_permissions'));

drop policy if exists "user_permissions_manage" on public.user_permissions;
create policy "user_permissions_manage" on public.user_permissions
  for insert to authenticated
  with check (public.has_permission('manage_permissions'));

drop policy if exists "user_permissions_update" on public.user_permissions;
create policy "user_permissions_update" on public.user_permissions
  for update to authenticated
  using (public.has_permission('manage_permissions'))
  with check (public.has_permission('manage_permissions'));

drop policy if exists "user_permissions_delete" on public.user_permissions;
create policy "user_permissions_delete" on public.user_permissions
  for delete to authenticated
  using (public.has_permission('manage_permissions'));
