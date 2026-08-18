-- RLS : tout le reste des modules opérationnels. Ces tables ne portent pas
-- de données financières : la base line est "tout compte actif de l'équipe
-- peut voir/utiliser", affinée par permission granulaire là où le cahier des
-- charges différencie explicitement les rôles (stock, commandes,
-- stérilisation, équipement, documents, équipe).

-- Tâches -----------------------------------------------------------------
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;

drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks for select to authenticated using (public.is_active_staff());
drop policy if exists "tasks_insert" on public.tasks;
create policy "tasks_insert" on public.tasks for insert to authenticated with check (public.is_active_staff());
drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update" on public.tasks for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());
drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks for delete to authenticated using (created_by = auth.uid() or public.has_permission('manage_users'));

drop policy if exists "task_assignments_select" on public.task_assignments;
create policy "task_assignments_select" on public.task_assignments for select to authenticated using (public.is_active_staff());
drop policy if exists "task_assignments_write" on public.task_assignments;
create policy "task_assignments_write" on public.task_assignments for all to authenticated using (public.is_active_staff()) with check (public.is_active_staff());

-- Post-it & communication interne -----------------------------------------
alter table public.post_its enable row level security;
alter table public.internal_messages enable row level security;
alter table public.message_acknowledgements enable row level security;

drop policy if exists "post_its_select" on public.post_its;
create policy "post_its_select" on public.post_its for select to authenticated using (public.is_active_staff());
drop policy if exists "post_its_insert" on public.post_its;
create policy "post_its_insert" on public.post_its for insert to authenticated with check (public.is_active_staff());
drop policy if exists "post_its_update" on public.post_its;
create policy "post_its_update" on public.post_its for update to authenticated using (author_id = auth.uid() or public.has_permission('manage_users')) with check (author_id = auth.uid() or public.has_permission('manage_users'));
drop policy if exists "post_its_delete" on public.post_its;
create policy "post_its_delete" on public.post_its for delete to authenticated using (author_id = auth.uid() or public.has_permission('manage_users'));

drop policy if exists "internal_messages_select" on public.internal_messages;
create policy "internal_messages_select" on public.internal_messages for select to authenticated using (public.is_active_staff());
drop policy if exists "internal_messages_insert" on public.internal_messages;
create policy "internal_messages_insert" on public.internal_messages for insert to authenticated with check (public.my_role() in ('owner_dentist', 'admin_staff', 'super_admin'));
drop policy if exists "internal_messages_update" on public.internal_messages;
create policy "internal_messages_update" on public.internal_messages for update to authenticated using (author_id = auth.uid() or public.has_permission('manage_users')) with check (author_id = auth.uid() or public.has_permission('manage_users'));
drop policy if exists "internal_messages_delete" on public.internal_messages;
create policy "internal_messages_delete" on public.internal_messages for delete to authenticated using (author_id = auth.uid() or public.has_permission('manage_users'));

drop policy if exists "message_acknowledgements_select" on public.message_acknowledgements;
create policy "message_acknowledgements_select" on public.message_acknowledgements for select to authenticated using (user_id = auth.uid());
drop policy if exists "message_acknowledgements_insert" on public.message_acknowledgements;
create policy "message_acknowledgements_insert" on public.message_acknowledgements for insert to authenticated with check (user_id = auth.uid());

-- Fournisseurs, demandes matériel, commandes, stock ------------------------
alter table public.suppliers enable row level security;
alter table public.material_requests enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stock_items enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists "suppliers_select" on public.suppliers;
create policy "suppliers_select" on public.suppliers for select to authenticated using (public.is_active_staff());
drop policy if exists "suppliers_manage" on public.suppliers;
create policy "suppliers_manage" on public.suppliers for all to authenticated using (public.has_permission('manage_orders')) with check (public.has_permission('manage_orders'));

drop policy if exists "material_requests_select" on public.material_requests;
create policy "material_requests_select" on public.material_requests for select to authenticated using (public.is_active_staff());
drop policy if exists "material_requests_insert" on public.material_requests;
create policy "material_requests_insert" on public.material_requests for insert to authenticated with check (public.is_active_staff());
drop policy if exists "material_requests_update" on public.material_requests;
create policy "material_requests_update" on public.material_requests for update to authenticated
  using (public.has_permission('manage_orders') or (requested_by = auth.uid() and status = 'pending_approval'))
  with check (public.has_permission('manage_orders') or (requested_by = auth.uid() and status = 'pending_approval'));
drop policy if exists "material_requests_delete" on public.material_requests;
create policy "material_requests_delete" on public.material_requests for delete to authenticated
  using (public.has_permission('manage_orders') or (requested_by = auth.uid() and status = 'pending_approval'));

drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders for select to authenticated using (public.has_permission('view_orders'));
drop policy if exists "orders_manage" on public.orders;
create policy "orders_manage" on public.orders for all to authenticated using (public.has_permission('manage_orders')) with check (public.has_permission('manage_orders'));

drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items for select to authenticated using (public.has_permission('view_orders'));
drop policy if exists "order_items_manage" on public.order_items;
create policy "order_items_manage" on public.order_items for all to authenticated using (public.has_permission('manage_orders')) with check (public.has_permission('manage_orders'));

drop policy if exists "stock_items_select" on public.stock_items;
create policy "stock_items_select" on public.stock_items for select to authenticated using (public.has_permission('view_stock'));
drop policy if exists "stock_items_manage" on public.stock_items;
create policy "stock_items_manage" on public.stock_items for all to authenticated using (public.has_permission('manage_stock')) with check (public.has_permission('manage_stock'));

drop policy if exists "stock_movements_select" on public.stock_movements;
create policy "stock_movements_select" on public.stock_movements for select to authenticated using (public.has_permission('view_stock'));
drop policy if exists "stock_movements_insert" on public.stock_movements;
create policy "stock_movements_insert" on public.stock_movements for insert to authenticated with check (public.has_permission('manage_stock'));

-- Équipements, maintenance, pannes, stérilisation ---------------------------
alter table public.equipment enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.breakdowns enable row level security;
alter table public.sterilization_cycles enable row level security;
alter table public.sterilization_incidents enable row level security;
alter table public.sterilization_incident_notifications enable row level security;
alter table public.sterilization_controls enable row level security;

drop policy if exists "equipment_select" on public.equipment;
create policy "equipment_select" on public.equipment for select to authenticated using (public.has_permission('view_equipment'));
drop policy if exists "equipment_manage" on public.equipment;
create policy "equipment_manage" on public.equipment for all to authenticated using (public.has_permission('manage_equipment')) with check (public.has_permission('manage_equipment'));

drop policy if exists "maintenance_records_select" on public.maintenance_records;
create policy "maintenance_records_select" on public.maintenance_records for select to authenticated using (public.has_permission('view_equipment'));
drop policy if exists "maintenance_records_insert" on public.maintenance_records;
create policy "maintenance_records_insert" on public.maintenance_records for insert to authenticated with check (public.has_permission('manage_equipment'));

drop policy if exists "breakdowns_select" on public.breakdowns;
create policy "breakdowns_select" on public.breakdowns for select to authenticated using (public.has_permission('view_equipment'));
drop policy if exists "breakdowns_insert" on public.breakdowns;
create policy "breakdowns_insert" on public.breakdowns for insert to authenticated with check (public.is_active_staff());
drop policy if exists "breakdowns_update" on public.breakdowns;
create policy "breakdowns_update" on public.breakdowns for update to authenticated using (public.has_permission('manage_equipment')) with check (public.has_permission('manage_equipment'));

drop policy if exists "sterilization_cycles_select" on public.sterilization_cycles;
create policy "sterilization_cycles_select" on public.sterilization_cycles for select to authenticated using (public.has_permission('view_sterilization'));
drop policy if exists "sterilization_cycles_insert" on public.sterilization_cycles;
create policy "sterilization_cycles_insert" on public.sterilization_cycles for insert to authenticated with check (public.has_permission('manage_sterilization'));
drop policy if exists "sterilization_cycles_update" on public.sterilization_cycles;
create policy "sterilization_cycles_update" on public.sterilization_cycles for update to authenticated using (public.has_permission('manage_sterilization')) with check (public.has_permission('manage_sterilization'));

drop policy if exists "sterilization_incidents_select" on public.sterilization_incidents;
create policy "sterilization_incidents_select" on public.sterilization_incidents for select to authenticated using (public.has_permission('view_sterilization'));
drop policy if exists "sterilization_incidents_write" on public.sterilization_incidents;
create policy "sterilization_incidents_write" on public.sterilization_incidents for all to authenticated using (public.has_permission('manage_sterilization')) with check (public.has_permission('manage_sterilization'));

drop policy if exists "sterilization_incident_notifications_select" on public.sterilization_incident_notifications;
create policy "sterilization_incident_notifications_select" on public.sterilization_incident_notifications for select to authenticated
  using (user_id = auth.uid() or public.has_permission('manage_sterilization'));
drop policy if exists "sterilization_incident_notifications_insert" on public.sterilization_incident_notifications;
create policy "sterilization_incident_notifications_insert" on public.sterilization_incident_notifications for insert to authenticated
  with check (public.has_permission('manage_sterilization'));

drop policy if exists "sterilization_controls_select" on public.sterilization_controls;
create policy "sterilization_controls_select" on public.sterilization_controls for select to authenticated using (public.has_permission('view_sterilization'));
drop policy if exists "sterilization_controls_manage" on public.sterilization_controls;
create policy "sterilization_controls_manage" on public.sterilization_controls for all to authenticated using (public.has_permission('manage_sterilization')) with check (public.has_permission('manage_sterilization'));

-- Laboratoires, documents, check-lists --------------------------------------
alter table public.laboratories enable row level security;
alter table public.document_categories enable row level security;
alter table public.documents enable row level security;
alter table public.document_favorites enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_entries enable row level security;

drop policy if exists "laboratories_select" on public.laboratories;
create policy "laboratories_select" on public.laboratories for select to authenticated using (public.is_active_staff());
drop policy if exists "laboratories_manage" on public.laboratories;
create policy "laboratories_manage" on public.laboratories for all to authenticated using (public.has_permission('manage_documents')) with check (public.has_permission('manage_documents'));

drop policy if exists "document_categories_select" on public.document_categories;
create policy "document_categories_select" on public.document_categories for select to authenticated using (public.is_active_staff());
drop policy if exists "document_categories_manage" on public.document_categories;
create policy "document_categories_manage" on public.document_categories for all to authenticated using (public.has_permission('manage_documents')) with check (public.has_permission('manage_documents'));

drop policy if exists "documents_select" on public.documents;
create policy "documents_select" on public.documents for select to authenticated using (public.has_permission('view_documents'));
drop policy if exists "documents_manage" on public.documents;
create policy "documents_manage" on public.documents for all to authenticated using (public.has_permission('manage_documents')) with check (public.has_permission('manage_documents'));

drop policy if exists "document_favorites_all" on public.document_favorites;
create policy "document_favorites_all" on public.document_favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "checklist_templates_select" on public.checklist_templates;
create policy "checklist_templates_select" on public.checklist_templates for select to authenticated using (public.is_active_staff());
drop policy if exists "checklist_templates_manage" on public.checklist_templates;
create policy "checklist_templates_manage" on public.checklist_templates for all to authenticated
  using (public.my_role() in ('owner_dentist', 'super_admin'))
  with check (public.my_role() in ('owner_dentist', 'super_admin'));

drop policy if exists "checklist_entries_select" on public.checklist_entries;
create policy "checklist_entries_select" on public.checklist_entries for select to authenticated using (public.is_active_staff());
drop policy if exists "checklist_entries_insert" on public.checklist_entries;
create policy "checklist_entries_insert" on public.checklist_entries for insert to authenticated with check (public.is_active_staff());
drop policy if exists "checklist_entries_update" on public.checklist_entries;
create policy "checklist_entries_update" on public.checklist_entries for update to authenticated
  using (completed_by = auth.uid() or public.my_role() in ('owner_dentist', 'super_admin'))
  with check (completed_by = auth.uid() or public.my_role() in ('owner_dentist', 'super_admin'));

-- Calendrier & absences ------------------------------------------------------
alter table public.internal_events enable row level security;
alter table public.absences enable row level security;

drop policy if exists "internal_events_select" on public.internal_events;
create policy "internal_events_select" on public.internal_events for select to authenticated using (public.is_active_staff());
drop policy if exists "internal_events_insert" on public.internal_events;
create policy "internal_events_insert" on public.internal_events for insert to authenticated with check (public.is_active_staff());
drop policy if exists "internal_events_update" on public.internal_events;
create policy "internal_events_update" on public.internal_events for update to authenticated using (created_by = auth.uid() or public.has_permission('manage_users')) with check (created_by = auth.uid() or public.has_permission('manage_users'));
drop policy if exists "internal_events_delete" on public.internal_events;
create policy "internal_events_delete" on public.internal_events for delete to authenticated using (created_by = auth.uid() or public.has_permission('manage_users'));

drop policy if exists "absences_select" on public.absences;
create policy "absences_select" on public.absences for select to authenticated using (user_id = auth.uid() or public.has_permission('view_team'));
drop policy if exists "absences_insert" on public.absences;
create policy "absences_insert" on public.absences for insert to authenticated with check (user_id = auth.uid() or public.has_permission('manage_users'));
drop policy if exists "absences_update" on public.absences;
create policy "absences_update" on public.absences for update to authenticated
  using (public.has_permission('manage_users') or (user_id = auth.uid() and status = 'requested'))
  with check (public.has_permission('manage_users') or (user_id = auth.uid() and status = 'requested'));
drop policy if exists "absences_delete" on public.absences;
create policy "absences_delete" on public.absences for delete to authenticated
  using (public.has_permission('manage_users') or (user_id = auth.uid() and status = 'requested'));

-- Notifications & audit -------------------------------------------------------
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.device_tokens enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notifications_delete" on public.notifications;
create policy "notifications_delete" on public.notifications for delete to authenticated using (user_id = auth.uid());
-- Pas de policy insert : uniquement généré par des fonctions SECURITY DEFINER
-- (voir 0012_business_notification_triggers.sql).

drop policy if exists "notification_preferences_all" on public.notification_preferences;
create policy "notification_preferences_all" on public.notification_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "device_tokens_all" on public.device_tokens;
create policy "device_tokens_all" on public.device_tokens for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "audit_logs_select" on public.audit_logs;
create policy "audit_logs_select" on public.audit_logs for select to authenticated using (public.has_permission('view_audit_logs'));
-- Aucune policy insert/update/delete pour "authenticated" : seules les
-- fonctions SECURITY DEFINER (log_audit_event, audit_table_change) écrivent
-- ici, avec les droits du propriétaire des migrations — le journal est donc
-- infalsifiable depuis l'API, pas seulement "protégé".
