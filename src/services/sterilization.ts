import { supabase } from '@/lib/supabase';
import type { SterilizationControlInsert, SterilizationCycleInsert, SterilizationIncidentInsert } from '@/types/database';

export async function listTodayCycles() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('sterilization_cycles')
    .select('*')
    .gte('performed_at', start.toISOString())
    .order('performed_at', { ascending: false });
  if (error) throw error;
  return data;
}

export interface CycleFilters {
  fromDate?: string | null;
  toDate?: string | null;
  performedBy?: string | null;
  equipmentId?: string | null;
  batchNumber?: string | null;
  result?: 'conforming' | 'non_conforming' | null;
}

/** §36 Traçabilité stérilisation : historique complet + filtres (date, utilisateur, appareil, lot, conformité). */
export async function listCycles(filters: CycleFilters = {}, limitCount = 100) {
  let query = supabase.from('sterilization_cycles').select('*').order('performed_at', { ascending: false }).limit(limitCount);

  if (filters.fromDate) query = query.gte('performed_at', filters.fromDate);
  if (filters.toDate) query = query.lte('performed_at', filters.toDate);
  if (filters.performedBy) query = query.eq('performed_by', filters.performedBy);
  if (filters.equipmentId) query = query.eq('equipment_id', filters.equipmentId);
  if (filters.batchNumber) query = query.ilike('batch_number', `%${filters.batchNumber}%`);
  if (filters.result) query = query.eq('result', filters.result);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createCycle(input: SterilizationCycleInsert) {
  const { data, error } = await supabase.from('sterilization_cycles').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listOpenSterilizationIncidents(limitCount = 10) {
  const { data, error } = await supabase
    .from('sterilization_incidents')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(limitCount);
  if (error) throw error;
  return data;
}

export async function listIncidents(limitCount = 50) {
  const { data, error } = await supabase.from('sterilization_incidents').select('*').order('created_at', { ascending: false }).limit(limitCount);
  if (error) throw error;
  return data;
}

/** §35 Cycle non conforme : enregistrer l'incident et notifier les personnes appropriées. */
export async function createIncident(input: SterilizationIncidentInsert, notifyUserIds: string[] = []) {
  const { data, error } = await supabase.from('sterilization_incidents').insert(input).select().single();
  if (error) throw error;

  if (notifyUserIds.length > 0) {
    const { error: notifyError } = await supabase
      .from('sterilization_incident_notifications')
      .insert(notifyUserIds.map((userId) => ({ incident_id: data.id, user_id: userId })));
    if (notifyError) throw notifyError;
  }

  return data;
}

export async function resolveIncident(id: string, correctiveAction: string) {
  const { error } = await supabase.from('sterilization_incidents').update({ corrective_action: correctiveAction, status: 'resolved' }).eq('id', id);
  if (error) throw error;
}

/** §37 Contrôles stérilisation (Bowie-Dick, Helix, tests de pénétration...). */
export async function listControls(limitCount = 50) {
  const { data, error } = await supabase.from('sterilization_controls').select('*').order('performed_at', { ascending: false }).limit(limitCount);
  if (error) throw error;
  return data;
}

export async function listUpcomingControls(limitCount = 10) {
  const { data, error } = await supabase
    .from('sterilization_controls')
    .select('*')
    .not('next_due_date', 'is', null)
    .order('next_due_date', { ascending: true })
    .limit(limitCount);
  if (error) throw error;
  return data;
}

export async function createControl(input: SterilizationControlInsert) {
  const { error } = await supabase.from('sterilization_controls').insert(input);
  if (error) throw error;
}
