import { supabase } from '@/lib/supabase';
import type { SupplierInsert, SupplierUpdate } from '@/types/database';

export async function listSuppliers() {
  const { data, error } = await supabase.from('suppliers').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createSupplier(input: SupplierInsert) {
  const { error } = await supabase.from('suppliers').insert(input);
  if (error) throw error;
}

export async function updateSupplier(id: string, input: SupplierUpdate) {
  const { error } = await supabase.from('suppliers').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteSupplier(id: string) {
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw error;
}
