import { supabase } from '@/lib/supabase';
import type { ChecklistEntryInsert, ChecklistItem, ChecklistTemplateInsert } from '@/types/database';

export async function listActiveChecklistTemplates() {
  const { data, error } = await supabase.from('checklist_templates').select('*').eq('active', true).order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listAllChecklistTemplates() {
  const { data, error } = await supabase.from('checklist_templates').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createChecklistTemplate(input: ChecklistTemplateInsert) {
  const { error } = await supabase.from('checklist_templates').insert(input);
  if (error) throw error;
}

export async function setChecklistTemplateActive(id: string, active: boolean) {
  const { error } = await supabase.from('checklist_templates').update({ active }).eq('id', id);
  if (error) throw error;
}

export async function listRecentChecklistEntries(limitCount = 30) {
  const { data, error } = await supabase.from('checklist_entries').select('*').order('performed_at', { ascending: false }).limit(limitCount);
  if (error) throw error;
  return data;
}

export async function createChecklistEntry(input: ChecklistEntryInsert) {
  const { error } = await supabase.from('checklist_entries').insert(input);
  if (error) throw error;
}

export function buildCompletedItems(items: ChecklistItem[], checked: Record<string, boolean>): (ChecklistItem & { checked: boolean })[] {
  return items.map((item) => ({ ...item, checked: !!checked[item.id] }));
}
