/**
 * Types reflétant supabase/migrations/*.sql, écrits à la main en l'absence
 * d'un projet Supabase live à interroger. Dès qu'un vrai projet existe,
 * remplacer ce fichier par `supabase gen types typescript --linked` (voir
 * docs/ARCHITECTURE.md) — la structure (Database.public.Tables.<table>.Row/
 * Insert/Update) est volontairement identique à la sortie de cette commande
 * pour que le remplacement soit transparent pour le reste du code.
 */

type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type AppRole = 'assistant' | 'collaborator_dentist' | 'owner_dentist' | 'admin_staff' | 'accountant' | 'super_admin';
export type ProfileStatus = 'active' | 'inactive';

export type AppSettingsRow = {
  id: number;
  cabinet_name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  primary_color: string;
  secondary_color: string;
  updated_at: string;
}
export type AppSettingsInsert = WithOptional<AppSettingsRow, 'id' | 'primary_color' | 'secondary_color' | 'updated_at'>;
export type AppSettingsUpdate = Partial<AppSettingsInsert>;

export type PractitionerRow = {
  id: string;
  first_name: string;
  last_name: string;
  color: string;
  status: 'active' | 'inactive';
  created_at: string;
}
export type PractitionerInsert = WithOptional<PractitionerRow, 'id' | 'color' | 'status' | 'created_at'>;
export type PractitionerUpdate = Partial<PractitionerInsert>;

export type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: AppRole;
  status: ProfileStatus;
  practitioner_id: string | null;
  phone: string | null;
  created_at: string;
}
export type ProfileInsert = WithOptional<ProfileRow, 'avatar_url' | 'status' | 'practitioner_id' | 'phone' | 'created_at'>;
export type ProfileUpdate = Partial<ProfileInsert>;

export type PermissionRow = {
  code: string;
  description: string;
  category: string;
}

export type RolePermissionRow = {
  role: AppRole;
  permission_code: string;
}

export type UserPermissionRow = {
  user_id: string;
  permission_code: string;
  granted: boolean;
  updated_by: string | null;
  updated_at: string;
}
export type UserPermissionInsert = WithOptional<UserPermissionRow, 'updated_by' | 'updated_at'>;
export type UserPermissionUpdate = Partial<UserPermissionInsert>;

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  created_by: string | null;
  responsible_id: string | null;
  assigned_role: AppRole | null;
  assigned_to_all: boolean;
  due_date: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  created_at: string;
  updated_at: string;
}
export type TaskInsert = WithOptional<TaskRow, 'id' | 'description' | 'notes' | 'responsible_id' | 'assigned_role' | 'assigned_to_all' | 'due_date' | 'priority' | 'status' | 'created_at' | 'updated_at'>;
export type TaskUpdate = Partial<TaskInsert>;

export type TaskAssignmentRow = {
  task_id: string;
  user_id: string;
}

export type PostItRow = {
  id: string;
  title: string | null;
  body: string;
  author_id: string | null;
  recipient_type: 'user' | 'role' | 'team';
  recipient_user_id: string | null;
  recipient_role: AppRole | null;
  color: string;
  priority: 'low' | 'normal' | 'high';
  due_date: string | null;
  pinned: boolean;
  created_at: string;
}
export type PostItInsert = WithOptional<PostItRow, 'id' | 'title' | 'recipient_type' | 'recipient_user_id' | 'recipient_role' | 'color' | 'priority' | 'due_date' | 'pinned' | 'created_at'>;
export type PostItUpdate = Partial<PostItInsert>;

export type InternalMessageRow = {
  id: string;
  title: string;
  body: string;
  author_id: string | null;
  audience_type: 'team' | 'role';
  audience_role: AppRole | null;
  requires_acknowledgement: boolean;
  created_at: string;
}
export type InternalMessageInsert = WithOptional<InternalMessageRow, 'id' | 'audience_type' | 'audience_role' | 'requires_acknowledgement' | 'created_at'>;
export type InternalMessageUpdate = Partial<InternalMessageInsert>;

export type MessageAcknowledgementRow = {
  message_id: string;
  user_id: string;
  acknowledged_at: string;
}

export type SupplierRow = {
  id: string;
  name: string;
  category: string | null;
  sales_rep_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  client_reference: string | null;
  notes: string | null;
  created_at: string;
}
export type SupplierInsert = WithOptional<SupplierRow, 'id' | 'category' | 'sales_rep_name' | 'phone' | 'email' | 'address' | 'website' | 'client_reference' | 'notes' | 'created_at'>;
export type SupplierUpdate = Partial<SupplierInsert>;

export type MaterialRequestRow = {
  id: string;
  requested_by: string | null;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  comment: string | null;
  supplier_id: string | null;
  reference: string | null;
  estimated_price: number | null;
  status: 'pending_approval' | 'to_order' | 'ordered' | 'partially_received' | 'received' | 'rejected';
  created_at: string;
  updated_at: string;
}
export type MaterialRequestInsert = WithOptional<MaterialRequestRow, 'id' | 'urgency' | 'comment' | 'supplier_id' | 'reference' | 'estimated_price' | 'status' | 'created_at' | 'updated_at'>;
export type MaterialRequestUpdate = Partial<MaterialRequestInsert>;

/** §28 : une demande contient une ou plusieurs lignes d'articles (voir migration 0021). */
export type MaterialRequestItemRow = {
  id: string;
  request_id: string;
  product_name: string;
  quantity: number;
  category: string | null;
  created_at: string;
}
export type MaterialRequestItemInsert = WithOptional<MaterialRequestItemRow, 'id' | 'quantity' | 'category' | 'created_at'>;

export type OrderRow = {
  id: string;
  supplier_id: string | null;
  order_number: string | null;
  ordered_by: string | null;
  ordered_at: string;
  expected_delivery_date: string | null;
  received_at: string | null;
  status: 'to_order' | 'ordered' | 'pending' | 'partially_received' | 'received' | 'cancelled';
  total_amount: number | null;
  invoice_reference: string | null;
  notes: string | null;
  material_request_id: string | null;
  created_at: string;
  updated_at: string;
}
export type OrderInsert = WithOptional<OrderRow, 'id' | 'supplier_id' | 'order_number' | 'ordered_at' | 'expected_delivery_date' | 'received_at' | 'status' | 'total_amount' | 'invoice_reference' | 'notes' | 'material_request_id' | 'created_at' | 'updated_at'>;
export type OrderUpdate = Partial<OrderInsert>;

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  unit_price: number | null;
}
export type OrderItemInsert = WithOptional<OrderItemRow, 'id' | 'unit_price'>;
export type OrderItemUpdate = Partial<OrderItemInsert>;

export type StockCategoryRow = {
  id: string;
  name: string;
  color: string;
  created_at: string;
}
export type StockCategoryInsert = WithOptional<StockCategoryRow, 'id' | 'color' | 'created_at'>;
export type StockCategoryUpdate = Partial<StockCategoryInsert>;

export type StockItemRow = {
  id: string;
  name: string;
  category_id: string | null;
  reference: string | null;
  quantity: number;
  unit: string;
  minimum_quantity: number;
  location: string | null;
  supplier_id: string | null;
  unit_price: number | null;
  expiry_date: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}
export type StockItemInsert = WithOptional<StockItemRow, 'id' | 'category_id' | 'reference' | 'quantity' | 'unit' | 'minimum_quantity' | 'location' | 'supplier_id' | 'unit_price' | 'expiry_date' | 'photo_url' | 'created_at' | 'updated_at'>;
export type StockItemUpdate = Partial<StockItemInsert>;

export type StockMovementRow = {
  id: string;
  stock_item_id: string;
  movement_type: 'in' | 'out' | 'correction' | 'order_reception' | 'loss' | 'expired';
  quantity: number;
  reason: string | null;
  user_id: string | null;
  created_at: string;
}
export type StockMovementInsert = WithOptional<StockMovementRow, 'id' | 'reason' | 'user_id' | 'created_at'>;

export type StockExpiryOverviewRow = {
  id: string;
  name: string;
  category_id: string | null;
  quantity: number;
  unit: string;
  location: string | null;
  expiry_date: string;
  expiry_bucket: 'expired' | 'under_30' | '30_to_60' | '60_to_90' | 'beyond_90';
}

export type EquipmentRow = {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  installation_date: string | null;
  warranty_until: string | null;
  supplier_id: string | null;
  maintenance_company: string | null;
  maintenance_phone: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  status: 'functional' | 'to_monitor' | 'broken' | 'maintenance_in_progress' | 'out_of_service';
  qr_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export type EquipmentInsert = WithOptional<EquipmentRow, 'id' | 'category' | 'brand' | 'model' | 'serial_number' | 'purchase_date' | 'installation_date' | 'warranty_until' | 'supplier_id' | 'maintenance_company' | 'maintenance_phone' | 'last_maintenance_date' | 'next_maintenance_date' | 'status' | 'qr_code' | 'notes' | 'created_at' | 'updated_at'>;
export type EquipmentUpdate = Partial<EquipmentInsert>;

export type MaintenanceRecordRow = {
  id: string;
  equipment_id: string;
  performed_at: string;
  performed_by: string | null;
  description: string | null;
  cost: number | null;
  next_due_date: string | null;
  created_at: string;
}
export type MaintenanceRecordInsert = WithOptional<MaintenanceRecordRow, 'id' | 'performed_at' | 'performed_by' | 'description' | 'cost' | 'next_due_date' | 'created_at'>;

export type BreakdownRow = {
  id: string;
  equipment_id: string | null;
  description: string;
  reported_by: string | null;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  status: 'reported' | 'technician_to_contact' | 'technician_contacted' | 'intervention_scheduled' | 'in_repair' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}
export type BreakdownInsert = WithOptional<BreakdownRow, 'id' | 'equipment_id' | 'urgency' | 'status' | 'created_at' | 'resolved_at'>;
export type BreakdownUpdate = Partial<BreakdownInsert>;

export type SterilizationCycleRow = {
  id: string;
  equipment_id: string | null;
  cycle_number: string | null;
  program: string | null;
  performed_by: string | null;
  batch_number: string | null;
  result: 'conforming' | 'non_conforming';
  comment: string | null;
  photo_url: string | null;
  performed_at: string;
  created_at: string;
}
export type SterilizationCycleInsert = WithOptional<SterilizationCycleRow, 'id' | 'equipment_id' | 'cycle_number' | 'program' | 'performed_by' | 'batch_number' | 'result' | 'comment' | 'photo_url' | 'performed_at' | 'created_at'>;

export type SterilizationIncidentRow = {
  id: string;
  cycle_id: string;
  description: string;
  corrective_action: string | null;
  reported_by: string | null;
  status: 'open' | 'resolved';
  created_at: string;
}
export type SterilizationIncidentInsert = WithOptional<SterilizationIncidentRow, 'id' | 'corrective_action' | 'reported_by' | 'status' | 'created_at'>;
export type SterilizationIncidentUpdate = Partial<SterilizationIncidentInsert>;

export type SterilizationControlRow = {
  id: string;
  control_type: 'bowie_dick' | 'helix' | 'penetration_test' | 'quality_control' | 'filter_change' | 'maintenance' | 'periodic';
  equipment_id: string | null;
  performed_by: string | null;
  performed_at: string;
  result: 'pass' | 'fail' | null;
  next_due_date: string | null;
  comment: string | null;
  photo_url: string | null;
  created_at: string;
}
export type SterilizationControlInsert = WithOptional<SterilizationControlRow, 'id' | 'equipment_id' | 'performed_by' | 'performed_at' | 'result' | 'next_due_date' | 'comment' | 'photo_url' | 'created_at'>;

export type SterilizationIncidentNotificationRow = {
  incident_id: string;
  user_id: string;
}

export type RevenueEntryRow = {
  id: string;
  practitioner_id: string;
  entry_date: string;
  amount: number;
  worked_day: boolean;
  patient_count: number | null;
  comment: string | null;
  created_by: string | null;
  created_at: string;
}
export type RevenueEntryInsert = WithOptional<RevenueEntryRow, 'id' | 'worked_day' | 'patient_count' | 'comment' | 'created_by' | 'created_at'>;
export type RevenueEntryUpdate = Partial<RevenueEntryInsert>;

/** §46 : décomposition facultative d'une ligne de CA par type d'acte (voir migration 0024). */
export type RevenueEntryDetailRow = {
  id: string;
  revenue_entry_id: string;
  procedure_type: 'soins' | 'prosthesis' | 'implant' | 'surgery' | 'orthodontics' | 'periodontics' | 'esthetics' | 'other';
  amount: number;
  created_at: string;
}
export type RevenueEntryDetailInsert = WithOptional<RevenueEntryDetailRow, 'id' | 'created_at'>;

export type FinancialTargetRow = {
  id: string;
  practitioner_id: string | null;
  period_type: 'daily' | 'monthly' | 'yearly';
  period_start: string;
  target_amount: number;
  created_at: string;
}
export type FinancialTargetInsert = WithOptional<FinancialTargetRow, 'id' | 'practitioner_id' | 'created_at'>;

export type ExpenseRow = {
  id: string;
  expense_date: string;
  amount: number;
  supplier_id: string | null;
  category: 'consumables' | 'equipment' | 'laboratory' | 'staff' | 'maintenance' | 'it' | 'rent' | 'insurance' | 'subscription' | 'other';
  payment_method: string | null;
  comment: string | null;
  photo_url: string | null;
  created_by: string | null;
  created_at: string;
}
export type ExpenseInsert = WithOptional<ExpenseRow, 'id' | 'expense_date' | 'supplier_id' | 'payment_method' | 'comment' | 'photo_url' | 'created_by' | 'created_at'>;
export type ExpenseUpdate = Partial<ExpenseInsert>;

export type LaboratoryRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_name: string | null;
  specialties: string | null;
  notes: string | null;
  created_at: string;
}
export type LaboratoryInsert = WithOptional<LaboratoryRow, 'id' | 'phone' | 'email' | 'address' | 'contact_name' | 'specialties' | 'notes' | 'created_at'>;
export type LaboratoryUpdate = Partial<LaboratoryInsert>;

export type DocumentCategoryRow = {
  id: string;
  name: string;
  sort_order: number;
}

export type DocumentRow = {
  id: string;
  title: string;
  category_id: string | null;
  file_path: string;
  file_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}
export type DocumentInsert = WithOptional<DocumentRow, 'id' | 'category_id' | 'file_type' | 'uploaded_by' | 'created_at'>;

export type DocumentFavoriteRow = {
  document_id: string;
  user_id: string;
}

export type ChecklistItem = {
  id: string;
  label: string;
}

export type ChecklistTemplateRow = {
  id: string;
  name: string;
  category: 'opening' | 'closing' | 'sterilization' | 'room_check' | 'cleaning' | 'end_of_day' | 'weekly_check' | 'other' | null;
  items: ChecklistItem[];
  created_by: string | null;
  active: boolean;
  created_at: string;
}
export type ChecklistTemplateInsert = WithOptional<ChecklistTemplateRow, 'id' | 'category' | 'created_by' | 'active' | 'created_at'>;
export type ChecklistTemplateUpdate = Partial<ChecklistTemplateInsert>;

export type ChecklistEntryRow = {
  id: string;
  template_id: string;
  completed_by: string | null;
  completed_items: (ChecklistItem & { checked: boolean; comment?: string })[];
  anomalies: string | null;
  performed_at: string;
  created_at: string;
}
export type ChecklistEntryInsert = WithOptional<ChecklistEntryRow, 'id' | 'completed_by' | 'completed_items' | 'anomalies' | 'performed_at' | 'created_at'>;

export type InternalEventRow = {
  id: string;
  title: string;
  event_type: 'maintenance' | 'meeting' | 'training' | 'control' | 'delivery' | 'leave' | 'other';
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  related_equipment_id: string | null;
  created_by: string | null;
  notes: string | null;
  created_at: string;
}
export type InternalEventInsert = WithOptional<InternalEventRow, 'id' | 'event_type' | 'ends_at' | 'all_day' | 'related_equipment_id' | 'created_by' | 'notes' | 'created_at'>;
export type InternalEventUpdate = Partial<InternalEventInsert>;

export type AbsenceRow = {
  id: string;
  user_id: string;
  absence_type: 'leave' | 'training' | 'sick' | 'recovery' | 'other';
  start_date: string;
  end_date: string;
  status: 'requested' | 'approved' | 'rejected';
  comment: string | null;
  created_at: string;
}
export type AbsenceInsert = WithOptional<AbsenceRow, 'id' | 'absence_type' | 'status' | 'comment' | 'created_at'>;
export type AbsenceUpdate = Partial<AbsenceInsert>;

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_urgent: boolean;
  read_at: string | null;
  created_at: string;
}
export type NotificationUpdate = Partial<Pick<NotificationRow, 'read_at'>>;

export type NotificationPreferenceRow = {
  user_id: string;
  categories_enabled: Record<string, boolean>;
  urgent_only: boolean;
}
export type NotificationPreferenceInsert = WithOptional<NotificationPreferenceRow, 'categories_enabled' | 'urgent_only'>;
export type NotificationPreferenceUpdate = Partial<NotificationPreferenceInsert>;

export type DeviceTokenRow = {
  id: string;
  user_id: string;
  expo_push_token: string;
  platform: 'ios' | 'android' | 'web' | null;
  created_at: string;
}
export type DeviceTokenInsert = WithOptional<DeviceTokenRow, 'id' | 'platform' | 'created_at'>;

export type AuditLogRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

// GenericTable/GenericView (types internes de @supabase/postgrest-js) exigent
// un champ Relationships — toujours vide ici : on n'utilise jamais les
// select imbriqués ("embeds") de PostgREST, seulement des jointures
// manuelles côté service (voir src/services/equipment.ts et auditLogs.ts).
export type NoRelationships = { Relationships: [] };

export type Database = {
  public: {
    Tables: {
      app_settings: { Row: AppSettingsRow; Insert: AppSettingsInsert; Update: AppSettingsUpdate } & NoRelationships;
      practitioners: { Row: PractitionerRow; Insert: PractitionerInsert; Update: PractitionerUpdate } & NoRelationships;
      profiles: { Row: ProfileRow; Insert: ProfileInsert; Update: ProfileUpdate } & NoRelationships;
      permissions: { Row: PermissionRow; Insert: PermissionRow; Update: Partial<PermissionRow> } & NoRelationships;
      role_permissions: { Row: RolePermissionRow; Insert: RolePermissionRow; Update: Partial<RolePermissionRow> } & NoRelationships;
      user_permissions: { Row: UserPermissionRow; Insert: UserPermissionInsert; Update: UserPermissionUpdate } & NoRelationships;
      tasks: { Row: TaskRow; Insert: TaskInsert; Update: TaskUpdate } & NoRelationships;
      task_assignments: { Row: TaskAssignmentRow; Insert: TaskAssignmentRow; Update: Partial<TaskAssignmentRow> } & NoRelationships;
      post_its: { Row: PostItRow; Insert: PostItInsert; Update: PostItUpdate } & NoRelationships;
      internal_messages: { Row: InternalMessageRow; Insert: InternalMessageInsert; Update: InternalMessageUpdate } & NoRelationships;
      message_acknowledgements: {
        Row: MessageAcknowledgementRow;
        Insert: WithOptional<MessageAcknowledgementRow, 'acknowledged_at'>;
        Update: never;
      } & NoRelationships;
      suppliers: { Row: SupplierRow; Insert: SupplierInsert; Update: SupplierUpdate } & NoRelationships;
      material_requests: { Row: MaterialRequestRow; Insert: MaterialRequestInsert; Update: MaterialRequestUpdate } & NoRelationships;
      material_request_items: { Row: MaterialRequestItemRow; Insert: MaterialRequestItemInsert; Update: never } & NoRelationships;
      orders: { Row: OrderRow; Insert: OrderInsert; Update: OrderUpdate } & NoRelationships;
      order_items: { Row: OrderItemRow; Insert: OrderItemInsert; Update: OrderItemUpdate } & NoRelationships;
      stock_categories: { Row: StockCategoryRow; Insert: StockCategoryInsert; Update: StockCategoryUpdate } & NoRelationships;
      stock_items: { Row: StockItemRow; Insert: StockItemInsert; Update: StockItemUpdate } & NoRelationships;
      stock_movements: { Row: StockMovementRow; Insert: StockMovementInsert; Update: never } & NoRelationships;
      equipment: { Row: EquipmentRow; Insert: EquipmentInsert; Update: EquipmentUpdate } & NoRelationships;
      maintenance_records: { Row: MaintenanceRecordRow; Insert: MaintenanceRecordInsert; Update: never } & NoRelationships;
      breakdowns: { Row: BreakdownRow; Insert: BreakdownInsert; Update: BreakdownUpdate } & NoRelationships;
      sterilization_cycles: { Row: SterilizationCycleRow; Insert: SterilizationCycleInsert; Update: never } & NoRelationships;
      sterilization_incidents: {
        Row: SterilizationIncidentRow;
        Insert: SterilizationIncidentInsert;
        Update: SterilizationIncidentUpdate;
      } & NoRelationships;
      sterilization_controls: { Row: SterilizationControlRow; Insert: SterilizationControlInsert; Update: never } & NoRelationships;
      sterilization_incident_notifications: {
        Row: SterilizationIncidentNotificationRow;
        Insert: SterilizationIncidentNotificationRow;
        Update: never;
      } & NoRelationships;
      revenue_entries: { Row: RevenueEntryRow; Insert: RevenueEntryInsert; Update: RevenueEntryUpdate } & NoRelationships;
      revenue_entry_details: { Row: RevenueEntryDetailRow; Insert: RevenueEntryDetailInsert; Update: never } & NoRelationships;
      financial_targets: { Row: FinancialTargetRow; Insert: FinancialTargetInsert; Update: never } & NoRelationships;
      expenses: { Row: ExpenseRow; Insert: ExpenseInsert; Update: ExpenseUpdate } & NoRelationships;
      laboratories: { Row: LaboratoryRow; Insert: LaboratoryInsert; Update: LaboratoryUpdate } & NoRelationships;
      document_categories: {
        Row: DocumentCategoryRow;
        Insert: WithOptional<DocumentCategoryRow, 'id' | 'sort_order'>;
        Update: Partial<DocumentCategoryRow>;
      } & NoRelationships;
      documents: { Row: DocumentRow; Insert: DocumentInsert; Update: never } & NoRelationships;
      document_favorites: { Row: DocumentFavoriteRow; Insert: DocumentFavoriteRow; Update: never } & NoRelationships;
      checklist_templates: { Row: ChecklistTemplateRow; Insert: ChecklistTemplateInsert; Update: ChecklistTemplateUpdate } & NoRelationships;
      checklist_entries: { Row: ChecklistEntryRow; Insert: ChecklistEntryInsert; Update: never } & NoRelationships;
      internal_events: { Row: InternalEventRow; Insert: InternalEventInsert; Update: InternalEventUpdate } & NoRelationships;
      absences: { Row: AbsenceRow; Insert: AbsenceInsert; Update: AbsenceUpdate } & NoRelationships;
      notifications: { Row: NotificationRow; Insert: never; Update: NotificationUpdate } & NoRelationships;
      notification_preferences: {
        Row: NotificationPreferenceRow;
        Insert: NotificationPreferenceInsert;
        Update: NotificationPreferenceUpdate;
      } & NoRelationships;
      device_tokens: { Row: DeviceTokenRow; Insert: DeviceTokenInsert; Update: never } & NoRelationships;
      audit_logs: { Row: AuditLogRow; Insert: never; Update: never } & NoRelationships;
    };
    Views: {
      stock_expiry_overview: { Row: StockExpiryOverviewRow } & NoRelationships;
    };
    Functions: {
      has_permission: { Args: { perm: string }; Returns: boolean };
      my_permissions: { Args: Record<string, never>; Returns: { permission_code: string }[] };
      my_role: { Args: Record<string, never>; Returns: AppRole };
      my_practitioner_id: { Args: Record<string, never>; Returns: string | null };
      is_active_staff: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
      profile_status: ProfileStatus;
    };
  };
}
