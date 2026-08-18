import { supabase } from '@/lib/supabase';
import type { StockItemInsert, StockItemUpdate, StockMovementRow } from '@/types/database';

/**
 * Le catalogue stock d'un cabinet reste modeste (quelques centaines
 * d'articles au plus) : on le récupère en une fois et on filtre côté client
 * plutôt que d'ajouter une vue SQL dédiée pour une comparaison quantité <=
 * seuil, que PostgREST ne sait pas exprimer nativement en filtre colonne-à-
 * colonne.
 */
export async function listStockAlerts() {
  const { data, error } = await supabase.from('stock_items').select('*').order('quantity', { ascending: true }).limit(200);
  if (error) throw error;

  return {
    outOfStock: data.filter((item) => item.quantity <= 0),
    lowStock: data.filter((item) => item.quantity > 0 && item.quantity <= item.minimum_quantity),
  };
}

export async function listExpiringStock(limitCount = 10) {
  const { data, error } = await supabase
    .from('stock_expiry_overview')
    .select('*')
    .in('expiry_bucket', ['expired', 'under_30'])
    .limit(limitCount);
  if (error) throw error;
  return data;
}

export async function listAllStockItems() {
  const { data, error } = await supabase.from('stock_items').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createStockItem(input: StockItemInsert) {
  const { error } = await supabase.from('stock_items').insert(input);
  if (error) throw error;
}

export async function updateStockItem(id: string, input: StockItemUpdate) {
  const { error } = await supabase.from('stock_items').update(input).eq('id', id);
  if (error) throw error;
}

export async function recordStockMovement(input: {
  stockItemId: string;
  movementType: StockMovementRow['movement_type'];
  quantity: number;
  reason: string | null;
  userId: string;
}) {
  const { error } = await supabase.from('stock_movements').insert({
    stock_item_id: input.stockItemId,
    movement_type: input.movementType,
    quantity: input.quantity,
    reason: input.reason,
    user_id: input.userId,
  });
  if (error) throw error;
}

export async function listStockMovements(stockItemId: string, limitCount = 20) {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('stock_item_id', stockItemId)
    .order('created_at', { ascending: false })
    .limit(limitCount);
  if (error) throw error;
  return data;
}
