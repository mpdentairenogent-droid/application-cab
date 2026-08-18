import { File, Paths } from 'expo-file-system';
import * as XLSX from 'xlsx';

import { normalizeForComparison, findClosestMatch, type ClosestMatch } from '@/lib/duplicateDetection';
import { supabase } from '@/lib/supabase';
import type { StockCategoryRow, StockItemRow } from '@/types/database';

import { createStockCategory } from './stockCategories';

export interface ParsedStockRow {
  rowNumber: number;
  name: string;
  categoryName: string | null;
  reference: string | null;
  quantity: number;
  unit: string;
  minimumQuantity: number;
  location: string | null;
  unitPrice: number | null;
}

export interface SkippedRow {
  rowNumber: number;
  reason: string;
}

type StockField = 'name' | 'category' | 'reference' | 'quantity' | 'unit' | 'minimumQuantity' | 'location' | 'unitPrice';

// Comparés après normalizeForComparison (accents/casse déjà neutralisés) —
// pas besoin d'accents dans cette liste.
const FIELD_ALIASES: Record<StockField, string[]> = {
  name: ['nom', 'name', 'article', 'produit', 'designation'],
  category: ['categorie', 'category'],
  reference: ['reference', 'ref'],
  quantity: ['quantite', 'quantity', 'qte', 'qty'],
  unit: ['unite', 'unit'],
  minimumQuantity: ['seuil minimum', 'seuil', 'stock minimum', 'quantite minimum', 'minimum'],
  location: ['emplacement', 'location', 'lieu'],
  unitPrice: ['prix unitaire', 'prix', 'unit price'],
};

function buildFieldMap(headers: string[]): Partial<Record<StockField, string>> {
  const map: Partial<Record<StockField, string>> = {};
  for (const header of headers) {
    const normalized = normalizeForComparison(header);
    for (const field of Object.keys(FIELD_ALIASES) as StockField[]) {
      if (map[field]) continue;
      if (FIELD_ALIASES[field].includes(normalized)) map[field] = header;
    }
  }
  return map;
}

function toText(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  return String(raw).trim();
}

function toNumberOrDefault(raw: unknown, fallback: number): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const text = toText(raw);
  if (!text) return fallback;
  const parsed = Number.parseFloat(text.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Colonnes reconnues (accents/casse/ordre indifférents) : Nom (obligatoire),
 * Catégorie, Référence, Quantité, Unité, Seuil minimum, Emplacement, Prix
 * unitaire — voir generateStockImportTemplate pour un fichier prêt à
 * remplir avec exactement ces en-têtes.
 */
export function parseStockWorkbook(bytes: Uint8Array): { rows: ParsedStockRow[]; skippedRows: SkippedRow[] } {
  const workbook = XLSX.read(bytes, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { rows: [], skippedRows: [] };

  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const rows: ParsedStockRow[] = [];
  const skippedRows: SkippedRow[] = [];

  raw.forEach((entry, index) => {
    const rowNumber = index + 2; // +1 pour l'en-tête, +1 pour repasser en indexation à partir de 1
    const fieldMap = buildFieldMap(Object.keys(entry));
    const name = fieldMap.name ? toText(entry[fieldMap.name]) : '';
    if (!name) {
      skippedRows.push({ rowNumber, reason: 'Nom manquant' });
      return;
    }

    rows.push({
      rowNumber,
      name,
      categoryName: fieldMap.category ? toText(entry[fieldMap.category]) || null : null,
      reference: fieldMap.reference ? toText(entry[fieldMap.reference]) || null : null,
      quantity: fieldMap.quantity ? toNumberOrDefault(entry[fieldMap.quantity], 0) : 0,
      unit: fieldMap.unit ? toText(entry[fieldMap.unit]) || 'unité' : 'unité',
      minimumQuantity: fieldMap.minimumQuantity ? toNumberOrDefault(entry[fieldMap.minimumQuantity], 0) : 0,
      location: fieldMap.location ? toText(entry[fieldMap.location]) || null : null,
      unitPrice: fieldMap.unitPrice ? toNumberOrDefault(entry[fieldMap.unitPrice], NaN) : NaN,
    });
  });

  return { rows: rows.map((r) => ({ ...r, unitPrice: Number.isFinite(r.unitPrice) ? r.unitPrice : null })), skippedRows };
}

export async function parseStockWorkbookFromUri(fileUri: string) {
  const file = new File(fileUri);
  const bytes = await file.bytes();
  return parseStockWorkbook(bytes);
}

export interface ImportPlanRow extends ParsedStockRow {
  resolvedCategoryId: string | null;
  newCategoryName: string | null;
  existingMatch: ClosestMatch<StockItemRow> | null;
  batchMatch: { rowNumber: number; similarity: number; exact: boolean } | null;
  defaultInclude: boolean;
}

/**
 * Résout la catégorie de chaque ligne (existante si le nom correspond
 * exactement une fois normalisé, sinon à créer) et signale les doublons
 * potentiels — contre le stock déjà en base ET entre les lignes du fichier
 * lui-même. Une correspondance EXACTE (même nom normalisé) démarre décochée
 * par défaut, quasi certainement le même article ; une correspondance
 * seulement proche reste cochée mais signalée, pour ne jamais faire
 * disparaître silencieusement un article réellement différent (§ variantes
 * de taille/référence) — l'utilisateur tranche dans tous les cas.
 */
export function buildImportPlan(parsedRows: ParsedStockRow[], existingItems: StockItemRow[], existingCategories: StockCategoryRow[]): ImportPlanRow[] {
  const seenInBatch: ParsedStockRow[] = [];
  const plan: ImportPlanRow[] = [];

  for (const row of parsedRows) {
    const existingMatch = findClosestMatch(row.name, existingItems, (item) => item.name);
    const batchCandidate = findClosestMatch(row.name, seenInBatch, (r) => r.name);
    const batchMatch = batchCandidate
      ? { rowNumber: batchCandidate.item.rowNumber, similarity: batchCandidate.similarity, exact: batchCandidate.exact }
      : null;

    let resolvedCategoryId: string | null = null;
    let newCategoryName: string | null = null;
    if (row.categoryName) {
      const categoryMatch = findClosestMatch(row.categoryName, existingCategories, (c) => c.name, 0.9);
      if (categoryMatch?.exact) resolvedCategoryId = categoryMatch.item.id;
      else newCategoryName = row.categoryName;
    }

    plan.push({
      ...row,
      resolvedCategoryId,
      newCategoryName,
      existingMatch,
      batchMatch,
      defaultInclude: !existingMatch?.exact && !batchMatch?.exact,
    });
    seenInBatch.push(row);
  }

  return plan;
}

/** `rows` doit déjà être filtré à ce que l'utilisateur a coché pour import. */
export async function commitStockImport(rows: ImportPlanRow[]): Promise<{ created: number }> {
  if (rows.length === 0) return { created: 0 };

  const categoryIdByNewName = new Map<string, string>();
  for (const row of rows) {
    if (!row.newCategoryName) continue;
    const key = normalizeForComparison(row.newCategoryName);
    if (categoryIdByNewName.has(key)) continue;
    const created = await createStockCategory({ name: row.newCategoryName.trim() });
    categoryIdByNewName.set(key, created.id);
  }

  const payload = rows.map((row) => ({
    name: row.name.trim(),
    category_id: row.resolvedCategoryId ?? (row.newCategoryName ? (categoryIdByNewName.get(normalizeForComparison(row.newCategoryName)) ?? null) : null),
    reference: row.reference,
    quantity: row.quantity,
    unit: row.unit,
    minimum_quantity: row.minimumQuantity,
    location: row.location,
    unit_price: row.unitPrice,
  }));

  const { error } = await supabase.from('stock_items').insert(payload);
  if (error) throw error;
  return { created: payload.length };
}

const TEMPLATE_HEADERS = ['Nom', 'Catégorie', 'Référence', 'Quantité', 'Unité', 'Seuil minimum', 'Emplacement', 'Prix unitaire'];
const TEMPLATE_EXAMPLE_ROW = ['Gants latex M', 'Consommables', 'REF-123', 50, 'boîte', 10, 'Placard A', 8.5];

/** Fichier .xlsx vierge (en-têtes + une ligne d'exemple) pour cadrer le format attendu par parseStockWorkbook. */
export async function generateStockImportTemplate(): Promise<File> {
  const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE_ROW]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as Uint8Array;

  const file = new File(Paths.cache, 'modele-import-stock.xlsx');
  file.create({ overwrite: true });
  file.write(new Uint8Array(bytes));
  return file;
}
