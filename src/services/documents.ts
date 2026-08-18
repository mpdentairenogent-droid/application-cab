import { supabase } from '@/lib/supabase';
import type { DocumentCategoryRow, DocumentInsert } from '@/types/database';

export async function listDocumentCategories() {
  const { data, error } = await supabase.from('document_categories').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createDocumentCategory(input: Pick<DocumentCategoryRow, 'name'> & Partial<Pick<DocumentCategoryRow, 'sort_order'>>) {
  const { error } = await supabase.from('document_categories').insert(input);
  if (error) throw error;
}

export interface DocumentWithFavorite {
  id: string;
  title: string;
  category_id: string | null;
  file_path: string;
  file_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  isFavorite: boolean;
}

/** §48 : bibliothèque interne — jointure manuelle avec les favoris de l'utilisateur courant (même choix que ailleurs, voir equipment.ts). */
export async function listDocuments(userId: string): Promise<DocumentWithFavorite[]> {
  const [{ data: documents, error: docsError }, { data: favorites, error: favError }] = await Promise.all([
    supabase.from('documents').select('*').order('title', { ascending: true }),
    supabase.from('document_favorites').select('document_id').eq('user_id', userId),
  ]);
  if (docsError) throw docsError;
  if (favError) throw favError;

  const favoriteIds = new Set(favorites.map((f) => f.document_id));
  return documents.map((doc) => ({ ...doc, isFavorite: favoriteIds.has(doc.id) }));
}

export async function createDocument(input: DocumentInsert) {
  const { error } = await supabase.from('documents').insert(input);
  if (error) throw error;
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

export async function setDocumentFavorite(documentId: string, userId: string, isFavorite: boolean) {
  if (isFavorite) {
    const { error } = await supabase.from('document_favorites').insert({ document_id: documentId, user_id: userId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('document_favorites').delete().eq('document_id', documentId).eq('user_id', userId);
    if (error) throw error;
  }
}
