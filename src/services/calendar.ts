import { toISODate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { InternalEventInsert, InternalEventUpdate } from '@/types/database';

/** §49 : événements à venir, ordre chronologique — pas d'historique passé par défaut pour rester rapide à consulter. */
export async function listUpcomingEvents(limitCount = 100) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('internal_events')
    .select('*')
    .gte('starts_at', start.toISOString())
    .order('starts_at', { ascending: true })
    .limit(limitCount);
  if (error) throw error;
  return data;
}

export async function listPastEvents(limitCount = 50) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('internal_events')
    .select('*')
    .lt('starts_at', start.toISOString())
    .order('starts_at', { ascending: false })
    .limit(limitCount);
  if (error) throw error;
  return data;
}

export async function createEvent(input: InternalEventInsert) {
  const { error } = await supabase.from('internal_events').insert(input);
  if (error) throw error;
}

export async function updateEvent(id: string, input: InternalEventUpdate) {
  const { error } = await supabase.from('internal_events').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('internal_events').delete().eq('id', id);
  if (error) throw error;
}

export async function listEquipmentMaintenanceDue(withinDays = 30) {
  const limit = new Date();
  limit.setDate(limit.getDate() + withinDays);
  const { data, error } = await supabase
    .from('equipment')
    .select('id, name, next_maintenance_date')
    .not('next_maintenance_date', 'is', null)
    .lte('next_maintenance_date', toISODate(limit))
    .order('next_maintenance_date', { ascending: true });
  if (error) throw error;
  return data;
}
