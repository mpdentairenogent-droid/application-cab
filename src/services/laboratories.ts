import { supabase } from '@/lib/supabase';
import type { LaboratoryInsert, LaboratoryUpdate } from '@/types/database';

export async function listLaboratories() {
  const { data, error } = await supabase.from('laboratories').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createLaboratory(input: LaboratoryInsert) {
  const { error } = await supabase.from('laboratories').insert(input);
  if (error) throw error;
}

export async function updateLaboratory(id: string, input: LaboratoryUpdate) {
  const { error } = await supabase.from('laboratories').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteLaboratory(id: string) {
  const { error } = await supabase.from('laboratories').delete().eq('id', id);
  if (error) throw error;
}
