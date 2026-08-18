import { supabase } from '@/lib/supabase';
import type { PostItInsert, PostItUpdate } from '@/types/database';

export async function listPinnedPostIts(limitCount = 10) {
  const { data, error } = await supabase
    .from('post_its')
    .select('*')
    .eq('pinned', true)
    .order('created_at', { ascending: false })
    .limit(limitCount);
  if (error) throw error;
  return data;
}

export async function listAllPostIts() {
  const { data, error } = await supabase.from('post_its').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPostIt(input: PostItInsert) {
  const { error } = await supabase.from('post_its').insert(input);
  if (error) throw error;
}

export async function updatePostIt(id: string, input: PostItUpdate) {
  const { error } = await supabase.from('post_its').update(input).eq('id', id);
  if (error) throw error;
}

export async function deletePostIt(id: string) {
  const { error } = await supabase.from('post_its').delete().eq('id', id);
  if (error) throw error;
}

export async function setPostItPinned(id: string, pinned: boolean) {
  const { error } = await supabase.from('post_its').update({ pinned }).eq('id', id);
  if (error) throw error;
}
