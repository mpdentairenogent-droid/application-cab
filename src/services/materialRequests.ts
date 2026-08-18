import { supabase } from '@/lib/supabase';
import type { MaterialRequestInsert, MaterialRequestRow } from '@/types/database';

export interface MaterialRequestItemSummary {
  id: string;
  product_name: string;
  quantity: number;
  category: string | null;
}

export interface MaterialRequestWithItems extends MaterialRequestRow {
  items: MaterialRequestItemSummary[];
}

/**
 * Jointure faite manuellement (deux requêtes + fusion en mémoire), comme
 * attachEquipmentNames dans services/equipment.ts : notre Database type est
 * écrit à la main et ne décrit pas les relations de clé étrangère
 * nécessaires à l'inférence de type d'un embed PostgREST.
 */
async function attachItems(requests: MaterialRequestRow[]): Promise<MaterialRequestWithItems[]> {
  if (requests.length === 0) return [];

  const { data: items, error } = await supabase
    .from('material_request_items')
    .select('*')
    .in('request_id', requests.map((r) => r.id));
  if (error) throw error;

  const itemsByRequest = new Map<string, MaterialRequestItemSummary[]>();
  for (const item of items) {
    const list = itemsByRequest.get(item.request_id) ?? [];
    list.push({ id: item.id, product_name: item.product_name, quantity: item.quantity, category: item.category });
    itemsByRequest.set(item.request_id, list);
  }

  return requests.map((r) => ({ ...r, items: itemsByRequest.get(r.id) ?? [] }));
}

export async function listPendingMaterialRequests(limitCount = 10) {
  const { data, error } = await supabase
    .from('material_requests')
    .select('*')
    .in('status', ['pending_approval', 'to_order'])
    .order('created_at', { ascending: false })
    .limit(limitCount);
  if (error) throw error;
  return attachItems(data);
}

export async function listAllMaterialRequests() {
  const { data, error } = await supabase.from('material_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return attachItems(data);
}

export interface MaterialRequestItemInput {
  productName: string;
  quantity: number;
  category?: string | null;
}

/** §28 : une demande peut regrouper plusieurs articles — en-tête puis lignes, même principe que orders/order_items. */
export async function createMaterialRequest(header: MaterialRequestInsert, items: MaterialRequestItemInput[]) {
  const { data: request, error } = await supabase.from('material_requests').insert(header).select().single();
  if (error) throw error;

  const { error: itemsError } = await supabase
    .from('material_request_items')
    .insert(items.map((item) => ({ request_id: request.id, product_name: item.productName, quantity: item.quantity, category: item.category ?? null })));
  if (itemsError) throw itemsError;

  return request;
}

/** Résumé lisible d'une demande multi-articles pour les listes/cartes (dashboards, écran Stock). */
export function summarizeRequestItems(items: MaterialRequestItemSummary[]): string {
  if (items.length === 0) return 'Aucun article';
  if (items.length === 1) return `${items[0].product_name} × ${items[0].quantity}`;
  return `${items.length} articles : ${items.map((item) => item.product_name).join(', ')}`;
}

export async function setMaterialRequestStatus(id: string, status: MaterialRequestRow['status']) {
  const { error } = await supabase.from('material_requests').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteMaterialRequest(id: string) {
  const { error } = await supabase.from('material_requests').delete().eq('id', id);
  if (error) throw error;
}
