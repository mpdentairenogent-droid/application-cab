import { toISODate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { ExpenseInsert, ExpenseRow, ExpenseUpdate } from '@/types/database';

export async function listRecentExpenses(limitCount = 5) {
  const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false }).limit(limitCount);
  if (error) throw error;
  return data;
}

export async function listAllExpenses(limitCount = 100) {
  const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false }).limit(limitCount);
  if (error) throw error;
  return data;
}

export async function createExpense(input: ExpenseInsert) {
  const { error } = await supabase.from('expenses').insert(input);
  if (error) throw error;
}

export async function updateExpense(id: string, input: ExpenseUpdate) {
  const { error } = await supabase.from('expenses').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getExpensesThisMonthTotal(): Promise<number> {
  const { data, error } = await supabase.from('expenses').select('amount').gte('expense_date', toISODate(startOfMonth()));
  if (error) throw error;
  return data.reduce((sum, row) => sum + Number(row.amount), 0);
}

/** §46 évolution dépenses : total par mois sur les N derniers mois — toutes catégories, ou une seule si filtrée depuis la vue Statistiques. */
export async function getMonthlyExpensesSeries(monthsBack = 6, category?: ExpenseRow['category'] | null): Promise<{ month: string; total: number }[]> {
  const start = new Date();
  start.setDate(1);
  start.setMonth(start.getMonth() - (monthsBack - 1));
  start.setHours(0, 0, 0, 0);

  let query = supabase.from('expenses').select('expense_date, amount').gte('expense_date', toISODate(start));
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;

  const totals = new Map<string, number>();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    totals.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
  }
  for (const row of data) {
    const key = row.expense_date.slice(0, 7);
    if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + Number(row.amount));
  }
  return Array.from(totals.entries()).map(([month, total]) => ({ month, total }));
}

/** §46 dépenses par catégorie : total du mois en cours, pour le graphique en barres. */
export async function getExpensesByCategoryThisMonth(): Promise<{ category: ExpenseRow['category']; total: number }[]> {
  const { data, error } = await supabase.from('expenses').select('category, amount').gte('expense_date', toISODate(startOfMonth()));
  if (error) throw error;

  const totals = new Map<ExpenseRow['category'], number>();
  for (const row of data) {
    totals.set(row.category, (totals.get(row.category) ?? 0) + Number(row.amount));
  }
  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}
