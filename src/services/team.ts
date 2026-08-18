import { supabase } from '@/lib/supabase';
import type { AppRole, PermissionRow, PractitionerUpdate, ProfileUpdate, UserPermissionRow } from '@/types/database';

export async function listActiveTeamMembers() {
  const { data, error } = await supabase.from('profiles').select('*').eq('status', 'active').order('first_name', { ascending: true });
  if (error) throw error;
  return data;
}

/** §15 écran Équipe : le titulaire doit voir tout le monde, y compris les comptes désactivés, pour pouvoir les réactiver. */
export async function listAllTeamMembers() {
  const { data, error } = await supabase.from('profiles').select('*').order('status', { ascending: true }).order('first_name', { ascending: true });
  if (error) throw error;
  return data;
}

/** Changement de rôle ou de statut (activer/désactiver) — RLS profiles_update exige manage_users pour un autre compte que soi-même. */
export async function updateTeamMember(id: string, input: ProfileUpdate) {
  const { error } = await supabase.from('profiles').update(input).eq('id', id);
  if (error) throw error;
}

export async function getPractitioner(id: string) {
  const { data, error } = await supabase.from('practitioners').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

/**
 * prénom/nom d'un praticien sont dupliqués depuis profiles (voir migration
 * 0026 : handle_new_user copie les deux à la création) pour que les écrans
 * financiers n'aient jamais besoin de joindre profiles — cette fonction ne
 * touche que public.practitioners ; TeamMemberDetailSheet appelle aussi
 * updateTeamMember en parallèle pour garder les deux tables synchronisées.
 */
export async function updatePractitioner(id: string, input: PractitionerUpdate) {
  const { error } = await supabase.from('practitioners').update(input).eq('id', id);
  if (error) throw error;
}

export async function listPermissionsCatalog(): Promise<PermissionRow[]> {
  const { data, error } = await supabase.from('permissions').select('*').order('category', { ascending: true }).order('code', { ascending: true });
  if (error) throw error;
  return data;
}

// Retourne un tableau plutôt qu'un Set : TanStack Query persiste son cache en JSON
// (voir _layout.tsx), et JSON.stringify(new Set(...)) redevient "{}" au réhydratage
// (déjà vu sur AuthProvider.permissions — voir mémoire projet). Un tableau + .includes()
// reste correct après une sérialisation, un Set + .has() ne l'est pas.
export async function listRolePermissionCodes(role: AppRole): Promise<string[]> {
  const { data, error } = await supabase.from('role_permissions').select('permission_code').eq('role', role);
  if (error) throw error;
  return data.map((r) => r.permission_code);
}

export async function listUserPermissionOverrides(userId: string): Promise<UserPermissionRow[]> {
  const { data, error } = await supabase.from('user_permissions').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
}

/** §16 dérogation individuelle : granted=true ajoute une permission absente du rôle, granted=false en retire une accordée par défaut. */
export async function setUserPermissionOverride(userId: string, permissionCode: string, granted: boolean, updatedBy: string) {
  const { error } = await supabase
    .from('user_permissions')
    .upsert({ user_id: userId, permission_code: permissionCode, granted, updated_by: updatedBy, updated_at: new Date().toISOString() }, { onConflict: 'user_id,permission_code' });
  if (error) throw error;
}

/** Retour au comportement par défaut du rôle pour cette permission (supprime la dérogation). */
export async function clearUserPermissionOverride(userId: string, permissionCode: string) {
  const { error } = await supabase.from('user_permissions').delete().eq('user_id', userId).eq('permission_code', permissionCode);
  if (error) throw error;
}

export interface InviteTeamMemberInput {
  email: string;
  firstName: string;
  lastName: string;
  role: AppRole;
}

export interface InviteTeamMemberResult {
  userId: string;
  email: string;
  temporaryPassword: string;
}

/**
 * §15 "créer utilisateur", en libre-service depuis l'app (titulaire/super admin).
 * Passe par l'Edge Function `create-team-member` — seule elle détient la clé
 * service_role nécessaire à `auth.admin.createUser`, jamais exposée au client.
 * L'autorisation est revérifiée côté serveur (le titulaire ne peut pas être
 * usurpé même si un appel direct à cette fonction était forgé).
 */
export async function inviteTeamMember(input: InviteTeamMemberInput): Promise<InviteTeamMemberResult> {
  const { data, error } = await supabase.functions.invoke<InviteTeamMemberResult & { error?: string }>('create-team-member', {
    body: { email: input.email, firstName: input.firstName, lastName: input.lastName, role: input.role },
  });
  if (error) throw error;
  if (!data || data.error) throw new Error(data?.error ?? "Échec de la création du compte.");
  return data;
}
