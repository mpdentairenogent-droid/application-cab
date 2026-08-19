import { supabase } from '@/lib/supabase';

export interface ExtractedExpense {
  amount: number | null;
  expenseDate: string | null;
  supplierName: string | null;
  category: 'consumables' | 'equipment' | 'laboratory' | 'staff' | 'maintenance' | 'it' | 'rent' | 'insurance' | 'subscription' | 'other';
  comment: string | null;
}

/**
 * Envoie une photo de facture/reçu à la fonction serveur analyze-expense-receipt
 * (jamais d'appel direct à l'API Claude depuis le client — la clé reste
 * côté serveur). Ne fait que suggérer des valeurs : le formulaire de dépense
 * reste toujours à valider/corriger par l'utilisateur avant enregistrement.
 */
export async function analyzeExpenseReceipt(imageBase64: string, mimeType: string): Promise<ExtractedExpense> {
  const { data, error } = await supabase.functions.invoke<{ extracted?: ExtractedExpense; error?: string }>('analyze-expense-receipt', {
    body: { imageBase64, mimeType },
  });
  if (error) throw error;
  if (!data || data.error || !data.extracted) throw new Error(data?.error ?? "Échec de l'analyse de la facture.");
  return data.extracted;
}

export interface ExtractedCycle {
  cycleNumber: string | null;
  program: string | null;
  batchNumber: string | null;
  /** null = le service n'a pas pu déterminer le résultat avec certitude sur la photo — à vérifier soi-même, jamais une valeur devinée. */
  result: 'conforming' | 'non_conforming' | null;
  comment: string | null;
}

/** Même principe que analyzeExpenseReceipt, pour une photo d'étiquette/ticket d'autoclave — voir analyze-sterilization-cycle. */
export async function analyzeSterilizationCycle(imageBase64: string, mimeType: string): Promise<ExtractedCycle> {
  const { data, error } = await supabase.functions.invoke<{ extracted?: ExtractedCycle; error?: string }>('analyze-sterilization-cycle', {
    body: { imageBase64, mimeType },
  });
  if (error) throw error;
  if (!data || data.error || !data.extracted) throw new Error(data?.error ?? "Échec de l'analyse du cycle.");
  return data.extracted;
}

export interface ExtractedDeliveryItem {
  name: string;
  quantity: number;
}

export interface ExtractedDelivery {
  supplierName: string | null;
  deliveryDate: string | null;
  items: ExtractedDeliveryItem[];
}

/** Même principe que les deux autres scans, pour une photo de bon de livraison — voir analyze-delivery-note. Le rapprochement avec le catalogue stock se fait ensuite côté client (services/deliveryReceipt.ts), pas ici. */
export async function analyzeDeliveryNote(imageBase64: string, mimeType: string): Promise<ExtractedDelivery> {
  const { data, error } = await supabase.functions.invoke<{ extracted?: ExtractedDelivery; error?: string }>('analyze-delivery-note', {
    body: { imageBase64, mimeType },
  });
  if (error) throw error;
  if (!data || data.error || !data.extracted) throw new Error(data?.error ?? "Échec de l'analyse du bon de livraison.");
  return data.extracted;
}
