-- Catalogue des permissions granulaires (§16) et permissions par défaut de
-- chaque rôle (§11-15). Un titulaire peut ensuite déroger à ces valeurs par
-- utilisateur via user_permissions (voir has_permission() en 0004).

insert into public.permissions (code, description, category) values
  ('view_own_revenue', 'Voir son propre chiffre d''affaires', 'finance'),
  ('view_all_revenue', 'Voir le chiffre d''affaires de tous les praticiens', 'finance'),
  ('manage_revenue', 'Saisir/modifier le chiffre d''affaires', 'finance'),
  ('view_accounting', 'Voir la comptabilité interne', 'finance'),
  ('manage_accounting', 'Gérer la comptabilité interne', 'finance'),
  ('view_expenses', 'Voir les dépenses', 'finance'),
  ('manage_expenses', 'Saisir/modifier les dépenses', 'finance'),
  ('view_stock', 'Voir le stock', 'stock'),
  ('manage_stock', 'Gérer le stock', 'stock'),
  ('view_orders', 'Voir les commandes fournisseurs', 'orders'),
  ('manage_orders', 'Gérer les commandes fournisseurs', 'orders'),
  ('view_sterilization', 'Voir la stérilisation et la traçabilité', 'sterilization'),
  ('manage_sterilization', 'Enregistrer cycles et contrôles de stérilisation', 'sterilization'),
  ('view_equipment', 'Voir les équipements et la maintenance', 'equipment'),
  ('manage_equipment', 'Gérer les équipements, la maintenance et les pannes', 'equipment'),
  ('view_documents', 'Voir les documents et protocoles', 'documents'),
  ('manage_documents', 'Gérer les documents et protocoles', 'documents'),
  ('view_team', 'Voir l''équipe et les absences', 'team'),
  ('manage_users', 'Gérer les comptes, rôles et praticiens', 'team'),
  ('manage_permissions', 'Modifier les permissions accordées', 'team'),
  ('view_audit_logs', 'Consulter le journal d''audit', 'audit')
on conflict (code) do nothing;

-- Assistante dentaire : opérationnel complet, aucun accès financier.
insert into public.role_permissions (role, permission_code) values
  ('assistant', 'view_stock'), ('assistant', 'manage_stock'),
  ('assistant', 'view_orders'), ('assistant', 'manage_orders'),
  ('assistant', 'view_sterilization'), ('assistant', 'manage_sterilization'),
  ('assistant', 'view_equipment'), ('assistant', 'manage_equipment'),
  ('assistant', 'view_documents')
on conflict (role, permission_code) do nothing;

-- Dentiste collaborateur : sa propre activité + lecture opérationnelle.
insert into public.role_permissions (role, permission_code) values
  ('collaborator_dentist', 'view_own_revenue'),
  ('collaborator_dentist', 'view_stock'),
  ('collaborator_dentist', 'view_sterilization'),
  ('collaborator_dentist', 'view_equipment'),
  ('collaborator_dentist', 'view_documents')
on conflict (role, permission_code) do nothing;

-- Secrétariat / administratif : accès volontairement restreint par défaut,
-- le titulaire ajuste ensuite au cas par cas (§14).
insert into public.role_permissions (role, permission_code) values
  ('admin_staff', 'view_documents'),
  ('admin_staff', 'view_orders'),
  ('admin_staff', 'view_equipment')
on conflict (role, permission_code) do nothing;

-- Comptable : aucune permission par défaut — accès strictement sur
-- autorisation explicite du titulaire via user_permissions (§15).
-- (aucune ligne insérée intentionnellement)

-- Dentiste titulaire : accès complet.
insert into public.role_permissions (role, permission_code)
select 'owner_dentist', code from public.permissions
on conflict (role, permission_code) do nothing;

-- Super administrateur : accès complet, identique au titulaire.
insert into public.role_permissions (role, permission_code)
select 'super_admin', code from public.permissions
on conflict (role, permission_code) do nothing;
