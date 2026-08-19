import { findClosestMatch } from '@/lib/duplicateDetection';
import type { ExtractedDeliveryItem } from '@/services/aiExtraction';
import { recordStockMovement } from '@/services/stock';
import type { StockItemRow } from '@/types/database';

export interface DeliveryPlanRow {
  rowNumber: number;
  extractedName: string;
  quantity: number;
  match: { item: StockItemRow; exact: boolean } | null;
}

/**
 * Rapproche chaque article extrait du bon de livraison avec le catalogue
 * stock existant — même correspondance floue que l'import Excel et le lien
 * fournisseur (lib/duplicateDetection.ts). Une ligne sans correspondance est
 * signalée, jamais créée automatiquement : un nouvel article demande une
 * catégorie/unité/seuil que l'IA ne peut pas deviner depuis un bon de
 * livraison, à faire depuis l'écran Stock puis relancer la réception.
 */
export function buildDeliveryPlan(items: ExtractedDeliveryItem[], stockItems: StockItemRow[]): DeliveryPlanRow[] {
  return items.map((item, index) => {
    const found = findClosestMatch(item.name, stockItems, (s) => s.name);
    return {
      rowNumber: index + 1,
      extractedName: item.name,
      quantity: item.quantity,
      match: found ? { item: found.item, exact: found.exact } : null,
    };
  });
}

/** `rows` doit déjà être filtré par l'appelant sur ce que l'utilisateur a coché — pas de filtre implicite ici, seulement la garde défensive sur les lignes sans correspondance. */
export async function commitDeliveryReceipt(rows: DeliveryPlanRow[], userId: string): Promise<{ received: number }> {
  const toApply = rows.filter((row): row is DeliveryPlanRow & { match: NonNullable<DeliveryPlanRow['match']> } => !!row.match);
  for (const row of toApply) {
    await recordStockMovement({
      stockItemId: row.match.item.id,
      movementType: 'order_reception',
      quantity: row.quantity,
      reason: 'Réception livraison (scan IA)',
      userId,
    });
  }
  return { received: toApply.length };
}
