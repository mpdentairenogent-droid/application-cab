import { supabase } from '@/lib/supabase';
import type { BreakdownInsert, BreakdownUpdate, EquipmentInsert, EquipmentUpdate, MaintenanceRecordInsert } from '@/types/database';

/**
 * Jointure faite manuellement (deux requêtes + fusion en mémoire) plutôt
 * qu'un select imbriqué PostgREST : notre Database type est écrit à la main
 * (voir src/types/database.ts) et ne décrit pas les relations de clé
 * étrangère nécessaires à l'inférence de type d'un embed — plus simple et
 * tout aussi correct pour le volume de données concerné ici.
 */
export async function listOpenBreakdowns(limitCount = 10) {
  const { data: breakdowns, error } = await supabase
    .from('breakdowns')
    .select('*')
    .neq('status', 'resolved')
    .order('created_at', { ascending: false })
    .limit(limitCount);
  if (error) throw error;

  return attachEquipmentNames(breakdowns);
}

export async function listAllBreakdowns(limitCount = 100) {
  const { data, error } = await supabase.from('breakdowns').select('*').order('created_at', { ascending: false }).limit(limitCount);
  if (error) throw error;
  return attachEquipmentNames(data);
}

async function attachEquipmentNames<T extends { equipment_id: string | null }>(rows: T[]) {
  const equipmentIds = [...new Set(rows.map((b) => b.equipment_id).filter((id): id is string => !!id))];
  if (equipmentIds.length === 0) {
    return rows.map((b) => ({ ...b, equipmentName: null as string | null }));
  }

  const { data: equipmentRows, error: equipmentError } = await supabase.from('equipment').select('id, name').in('id', equipmentIds);
  if (equipmentError) throw equipmentError;

  const nameById = new Map(equipmentRows.map((e) => [e.id, e.name]));
  return rows.map((b) => ({ ...b, equipmentName: b.equipment_id ? (nameById.get(b.equipment_id) ?? null) : null }));
}

export async function createBreakdown(input: BreakdownInsert) {
  const { error } = await supabase.from('breakdowns').insert(input);
  if (error) throw error;
}

export async function updateBreakdownStatus(id: string, input: BreakdownUpdate) {
  const payload = input.status === 'resolved' ? { ...input, resolved_at: new Date().toISOString() } : input;
  const { error } = await supabase.from('breakdowns').update(payload).eq('id', id);
  if (error) throw error;
}

export async function listEquipmentNeedingAttention(limitCount = 10) {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .in('status', ['to_monitor', 'broken', 'maintenance_in_progress'])
    .limit(limitCount);
  if (error) throw error;
  return data;
}

export async function listAllEquipment() {
  const { data, error } = await supabase.from('equipment').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data;
}

/** §40 : le QR collé sur un appareil encode directement son id — récupéré ici après lecture par le scanner. */
export async function getEquipmentById(id: string) {
  const { data, error } = await supabase.from('equipment').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createEquipment(input: EquipmentInsert) {
  const { error } = await supabase.from('equipment').insert(input);
  if (error) throw error;
}

export async function updateEquipment(id: string, input: EquipmentUpdate) {
  const { error } = await supabase.from('equipment').update(input).eq('id', id);
  if (error) throw error;
}

/** Supprime aussi l'historique de maintenance associé (on delete cascade, 0007) ; pannes et contrôles de stérilisation gardent leur trace mais perdent la référence à l'appareil (on delete set null). */
export async function deleteEquipment(id: string) {
  const { error } = await supabase.from('equipment').delete().eq('id', id);
  if (error) throw error;
}

export async function listMaintenanceRecords(equipmentId: string, limitCount = 20) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('performed_at', { ascending: false })
    .limit(limitCount);
  if (error) throw error;
  return data;
}

export async function createMaintenanceRecord(input: MaintenanceRecordInsert) {
  const { error } = await supabase.from('maintenance_records').insert(input);
  if (error) throw error;
}
