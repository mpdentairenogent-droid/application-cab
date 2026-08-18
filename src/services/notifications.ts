import { supabase } from '@/lib/supabase';

export async function listMyNotifications(limitCount = 50) {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(limitCount);
  if (error) throw error;
  return data;
}

export async function countUnreadNotifications(): Promise<number> {
  const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
  if (error) throw error;
}
