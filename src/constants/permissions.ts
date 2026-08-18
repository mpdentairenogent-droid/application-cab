import type { AppRole } from '@/types/database';

/**
 * Miroir des codes définis dans supabase/migrations/0014_permissions_catalog.sql.
 * Ces constantes évitent les fautes de frappe dans le code client ; la
 * source de vérité de l'autorisation reste le serveur (has_permission() /
 * my_permissions() + RLS), jamais cette liste — voir [[usePermissions]].
 */
export const PERMISSIONS = {
  VIEW_OWN_REVENUE: 'view_own_revenue',
  VIEW_ALL_REVENUE: 'view_all_revenue',
  MANAGE_REVENUE: 'manage_revenue',
  VIEW_ACCOUNTING: 'view_accounting',
  MANAGE_ACCOUNTING: 'manage_accounting',
  VIEW_EXPENSES: 'view_expenses',
  MANAGE_EXPENSES: 'manage_expenses',
  VIEW_STOCK: 'view_stock',
  MANAGE_STOCK: 'manage_stock',
  VIEW_ORDERS: 'view_orders',
  MANAGE_ORDERS: 'manage_orders',
  VIEW_STERILIZATION: 'view_sterilization',
  MANAGE_STERILIZATION: 'manage_sterilization',
  VIEW_EQUIPMENT: 'view_equipment',
  MANAGE_EQUIPMENT: 'manage_equipment',
  VIEW_DOCUMENTS: 'view_documents',
  MANAGE_DOCUMENTS: 'manage_documents',
  VIEW_TEAM: 'view_team',
  MANAGE_USERS: 'manage_users',
  MANAGE_PERMISSIONS: 'manage_permissions',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_LABELS: Record<AppRole, string> = {
  assistant: 'Assistante dentaire',
  collaborator_dentist: 'Dentiste collaborateur',
  owner_dentist: 'Dentiste titulaire',
  admin_staff: 'Secrétariat',
  accountant: 'Comptable',
  super_admin: 'Super administrateur',
};

/** Miroir des catégories posées en 0014_permissions_catalog.sql (colonne permissions.category). */
export const PERMISSION_CATEGORY_LABEL: Record<string, string> = {
  finance: 'Finances',
  stock: 'Stock',
  orders: 'Commandes',
  sterilization: 'Stérilisation',
  equipment: 'Équipements',
  documents: 'Documents',
  team: 'Équipe',
  audit: 'Audit',
};
