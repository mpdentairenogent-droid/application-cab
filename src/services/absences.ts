import { supabase } from '@/lib/supabase';
import type { AbsenceInsert, AbsenceRow } from '@/types/database';

export async function listMyAbsences(userId: string) {
  const { data, error } = await supabase.from('absences').select('*').eq('user_id', userId).order('start_date', { ascending: false });
  if (error) throw error;
  return data;
}

/** RLS ne renvoie que ce que le rôle courant est autorisé à voir (ses propres absences, ou toute l'équipe si view_team) — pas de filtre supplémentaire nécessaire côté client. */
export async function listTeamAbsences() {
  const { data, error } = await supabase.from('absences').select('*').order('start_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAbsence(input: AbsenceInsert) {
  const { error } = await supabase.from('absences').insert(input);
  if (error) throw error;
}

export async function setAbsenceStatus(id: string, status: AbsenceRow['status']) {
  const { error } = await supabase.from('absences').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteAbsence(id: string) {
  const { error } = await supabase.from('absences').delete().eq('id', id);
  if (error) throw error;
}
