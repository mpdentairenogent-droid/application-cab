import { supabase } from '@/lib/supabase';
import type { StockCategoryInsert, StockCategoryUpdate } from '@/types/database';

export async function listStockCategories() {
  const { data, error } = await supabase.from('stock_categories').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createStockCategory(input: StockCategoryInsert) {
  const { data, error } = await supabase.from('stock_categories').insert(input).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateStockCategory(id: string, input: StockCategoryUpdate) {
  const { error } = await supabase.from('stock_categories').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteStockCategory(id: string) {
  const { error } = await supabase.from('stock_categories').delete().eq('id', id);
  if (error) throw error;
}
