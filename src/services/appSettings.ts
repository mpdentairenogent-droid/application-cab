import { supabase } from '@/lib/supabase';

export async function getAppSettings() {
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
}
