import { supabase } from '@/lib/supabase';
import type { AppRole, InternalMessageInsert } from '@/types/database';

export interface InternalMessageWithMeta {
  id: string;
  title: string;
  body: string;
  author_id: string | null;
  authorName: string | null;
  audience_type: 'team' | 'role';
  audience_role: AppRole | null;
  requires_acknowledgement: boolean;
  created_at: string;
  acknowledgedByMe: boolean;
  acknowledgementCount: number;
}

export async function listInternalMessages(currentUserId: string): Promise<InternalMessageWithMeta[]> {
  const { data: messages, error } = await supabase.from('internal_messages').select('*').order('created_at', { ascending: false });
  if (error) throw error;

  const authorIds = [...new Set(messages.map((m) => m.author_id).filter((id): id is string => !!id))];
  const authorsById = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, first_name, last_name').in('id', authorIds);
    if (profilesError) throw profilesError;
    for (const profile of profiles) authorsById.set(profile.id, `${profile.first_name} ${profile.last_name}`);
  }

  const messageIds = messages.map((m) => m.id);
  const acknowledgementsByMessage = new Map<string, number>();
  const acknowledgedByMe = new Set<string>();
  if (messageIds.length > 0) {
    const { data: acks, error: acksError } = await supabase.from('message_acknowledgements').select('message_id, user_id').in('message_id', messageIds);
    if (acksError) throw acksError;
    for (const ack of acks) {
      acknowledgementsByMessage.set(ack.message_id, (acknowledgementsByMessage.get(ack.message_id) ?? 0) + 1);
      if (ack.user_id === currentUserId) acknowledgedByMe.add(ack.message_id);
    }
  }

  return messages.map((message) => ({
    ...message,
    authorName: message.author_id ? (authorsById.get(message.author_id) ?? null) : null,
    acknowledgedByMe: acknowledgedByMe.has(message.id),
    acknowledgementCount: acknowledgementsByMessage.get(message.id) ?? 0,
  }));
}

export async function createInternalMessage(input: InternalMessageInsert) {
  const { error } = await supabase.from('internal_messages').insert(input);
  if (error) throw error;
}

export async function acknowledgeMessage(messageId: string, userId: string) {
  const { error } = await supabase.from('message_acknowledgements').insert({ message_id: messageId, user_id: userId });
  if (error) throw error;
}
