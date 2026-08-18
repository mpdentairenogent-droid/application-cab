import { supabase } from '@/lib/supabase';

const BUCKET = 'attachments';

/**
 * Upload une image locale (URI file:// renvoyée par expo-image-picker) vers
 * le bucket partagé et retourne son URL publique. arrayBuffer() plutôt que
 * blob() : lecture plus fiable d'un fichier local depuis React Native (Blob
 * a des soucis connus avec les URI file:// sur Hermes).
 */
export async function uploadImage(folder: string, localUri: string, mimeType = 'image/jpeg'): Promise<string> {
  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, { contentType: mimeType });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * À appeler juste avant l'enregistrement d'un formulaire avec photo : upload
 * seulement si photoUri pointe vers un fichier local fraîchement choisi (pas
 * déjà une URL http(s) existante, auquel cas rien n'a changé).
 */
export async function resolvePhotoUrl(folder: string, photoUri: string | null, mimeType?: string): Promise<string | null> {
  if (!photoUri) return null;
  if (photoUri.startsWith('http://') || photoUri.startsWith('https://')) return photoUri;
  return uploadImage(folder, photoUri, mimeType);
}
