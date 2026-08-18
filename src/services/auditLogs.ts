import { supabase } from '@/lib/supabase';

export async function listRecentAuditLogs(limitCount = 20) {
  const { data: logs, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limitCount);
  if (error) throw error;

  const userIds = [...new Set(logs.map((log) => log.user_id).filter((id): id is string => !!id))];
  if (userIds.length === 0) {
    return logs.map((log) => ({ ...log, actorName: null as string | null }));
  }

  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, first_name, last_name').in('id', userIds);
  if (profilesError) throw profilesError;

  const nameById = new Map(profiles.map((profile) => [profile.id, `${profile.first_name} ${profile.last_name}`]));
  return logs.map((log) => ({ ...log, actorName: log.user_id ? (nameById.get(log.user_id) ?? null) : null }));
}
