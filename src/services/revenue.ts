import { toISODate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { FinancialTargetInsert, FinancialTargetRow, PractitionerRow, RevenueEntryDetailRow, RevenueEntryInsert, RevenueEntryUpdate } from '@/types/database';

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const mondayOffset = (d.getDay() + 6) % 7; // semaine commence lundi
  d.setDate(d.getDate() - mondayOffset);
  return d;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1);
}

export interface RevenuePeriodSummary {
  today: number;
  week: number;
  month: number;
  year: number;
  workedDaysThisMonth: number;
}

/** CA d'un praticien agrégé par période, à partir des entrées de l'année en cours (§12, §42). */
export async function getPractitionerRevenueSummary(practitionerId: string): Promise<RevenuePeriodSummary> {
  const { data, error } = await supabase
    .from('revenue_entries')
    .select('entry_date, amount, worked_day')
    .eq('practitioner_id', practitionerId)
    .gte('entry_date', toISODate(startOfYear()));
  if (error) throw error;

  const todayStr = toISODate(startOfDay());
  const weekStr = toISODate(startOfWeek());
  const monthStr = toISODate(startOfMonth());

  const summary: RevenuePeriodSummary = { today: 0, week: 0, month: 0, year: 0, workedDaysThisMonth: 0 };

  for (const row of data) {
    const amount = Number(row.amount);
    summary.year += amount;
    if (row.entry_date >= monthStr) {
      summary.month += amount;
      if (row.worked_day) summary.workedDaysThisMonth += 1;
    }
    if (row.entry_date >= weekStr) summary.week += amount;
    if (row.entry_date === todayStr) summary.today += amount;
  }

  return summary;
}

export async function getPractitionerMonthlyTarget(practitionerId: string) {
  const { data, error } = await supabase
    .from('financial_targets')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .eq('period_type', 'monthly')
    .eq('period_start', toISODate(startOfMonth()))
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCabinetMonthlyTarget() {
  const { data, error } = await supabase
    .from('financial_targets')
    .select('*')
    .is('practitioner_id', null)
    .eq('period_type', 'monthly')
    .eq('period_start', toISODate(startOfMonth()))
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface PractitionerRevenueToday extends Pick<PractitionerRow, 'id' | 'first_name' | 'last_name' | 'color'> {
  amount: number;
}

/** CA du jour par praticien — vue titulaire (§22). */
export async function listPractitionersRevenueToday(): Promise<PractitionerRevenueToday[]> {
  const [{ data: practitioners, error: practitionersError }, { data: entries, error: entriesError }] = await Promise.all([
    supabase.from('practitioners').select('id, first_name, last_name, color').eq('status', 'active'),
    supabase.from('revenue_entries').select('practitioner_id, amount').eq('entry_date', toISODate(startOfDay())),
  ]);
  if (practitionersError) throw practitionersError;
  if (entriesError) throw entriesError;

  const amountByPractitioner = new Map<string, number>();
  for (const entry of entries) {
    amountByPractitioner.set(entry.practitioner_id, (amountByPractitioner.get(entry.practitioner_id) ?? 0) + Number(entry.amount));
  }

  return practitioners.map((practitioner) => ({ ...practitioner, amount: amountByPractitioner.get(practitioner.id) ?? 0 }));
}

export async function getCabinetRevenueSummary(): Promise<Pick<RevenuePeriodSummary, 'today' | 'month'>> {
  const { data, error } = await supabase.from('revenue_entries').select('entry_date, amount').gte('entry_date', toISODate(startOfMonth()));
  if (error) throw error;

  const todayStr = toISODate(startOfDay());
  let today = 0;
  let month = 0;
  for (const row of data) {
    const amount = Number(row.amount);
    month += amount;
    if (row.entry_date === todayStr) today += amount;
  }
  return { today, month };
}

/** Équivalent cabinet entier de getPractitionerRevenueSummary — utilisé quand "Tous les praticiens" est sélectionné dans la vue CA. */
export async function getCabinetRevenueSummaryFull(): Promise<RevenuePeriodSummary> {
  const { data, error } = await supabase.from('revenue_entries').select('entry_date, amount, worked_day').gte('entry_date', toISODate(startOfYear()));
  if (error) throw error;

  const todayStr = toISODate(startOfDay());
  const weekStr = toISODate(startOfWeek());
  const monthStr = toISODate(startOfMonth());

  const summary: RevenuePeriodSummary = { today: 0, week: 0, month: 0, year: 0, workedDaysThisMonth: 0 };
  for (const row of data) {
    const amount = Number(row.amount);
    summary.year += amount;
    if (row.entry_date >= monthStr) {
      summary.month += amount;
      if (row.worked_day) summary.workedDaysThisMonth += 1;
    }
    if (row.entry_date >= weekStr) summary.week += amount;
    if (row.entry_date === todayStr) summary.today += amount;
  }
  return summary;
}

export async function listMyRevenueHistory(practitionerId: string, limitCount = 30) {
  const { data, error } = await supabase
    .from('revenue_entries')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('entry_date', { ascending: false })
    .limit(limitCount);
  if (error) throw error;
  return data;
}

export async function listActivePractitioners() {
  const { data, error } = await supabase.from('practitioners').select('*').eq('status', 'active').order('first_name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listAllRevenueEntries(practitionerId?: string | null, limitCount = 100) {
  let query = supabase.from('revenue_entries').select('*').order('entry_date', { ascending: false }).limit(limitCount);
  if (practitionerId) query = query.eq('practitioner_id', practitionerId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createRevenueEntry(input: RevenueEntryInsert) {
  const { data, error } = await supabase.from('revenue_entries').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateRevenueEntry(id: string, input: RevenueEntryUpdate) {
  const { error } = await supabase.from('revenue_entries').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteRevenueEntry(id: string) {
  const { error } = await supabase.from('revenue_entries').delete().eq('id', id);
  if (error) throw error;
}

/** §43 : un objectif par (praticien|cabinet, période) — l'upsert s'appuie sur la contrainte unique posée en 0018. */
export async function upsertTarget(input: FinancialTargetInsert) {
  const { error } = await supabase.from('financial_targets').upsert(input, { onConflict: 'practitioner_id,period_type,period_start' });
  if (error) throw error;
}

export async function listTargets(limitCount = 50) {
  const { data, error } = await supabase.from('financial_targets').select('*').order('period_start', { ascending: false }).limit(limitCount);
  if (error) throw error;
  return data;
}

export async function deleteTarget(id: string) {
  const { error } = await supabase.from('financial_targets').delete().eq('id', id);
  if (error) throw error;
}

function periodRange(target: FinancialTargetRow): { start: string; end: string } {
  const [year, month, day] = target.period_start.split('-').map(Number);
  if (target.period_type === 'yearly') return { start: target.period_start, end: `${year + 1}-01-01` };
  if (target.period_type === 'monthly') return { start: target.period_start, end: toISODate(new Date(year, month, 1)) };
  return { start: target.period_start, end: toISODate(new Date(year, month - 1, day + 1)) };
}

export interface TargetWithActual extends FinancialTargetRow {
  actual: number;
}

/**
 * Le "réalisé" de chaque objectif n'est pas stocké : on récupère une seule
 * fenêtre de revenue_entries assez large pour couvrir tous les objectifs
 * chargés, puis on calcule chaque total côté client (évite N requêtes pour N
 * objectifs — volume modeste ici, voir le même choix dans equipment.ts).
 */
export async function listTargetsWithActuals(limitCount = 50): Promise<TargetWithActual[]> {
  const { data: targets, error: targetsError } = await supabase
    .from('financial_targets')
    .select('*')
    .order('period_start', { ascending: false })
    .limit(limitCount);
  if (targetsError) throw targetsError;
  if (targets.length === 0) return [];

  const earliestStart = targets.reduce((min, t) => (t.period_start < min ? t.period_start : min), targets[0].period_start);
  const { data: entries, error: entriesError } = await supabase
    .from('revenue_entries')
    .select('practitioner_id, entry_date, amount')
    .gte('entry_date', earliestStart);
  if (entriesError) throw entriesError;

  return targets.map((target) => {
    const { start, end } = periodRange(target);
    const actual = entries
      .filter((e) => e.entry_date >= start && e.entry_date < end && (target.practitioner_id === null || e.practitioner_id === target.practitioner_id))
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return { ...target, actual };
  });
}

export interface RevenueComparison {
  currentMonth: number;
  previousMonth: number;
  currentYear: number;
  previousYear: number;
  workedDaysThisMonth: number;
  monthEvolutionPct: number | null;
}

/** §42 comparaisons : mois actuel/précédent, année actuelle/précédente, évolution, CA moyen/jour — cabinet entier (praticien null) ou un praticien donné. */
export async function getRevenueComparison(practitionerId?: string | null): Promise<RevenueComparison> {
  const previousYearStart = toISODate(startOfYear(new Date(new Date().getFullYear() - 1, 0, 1)));

  let query = supabase.from('revenue_entries').select('entry_date, amount, worked_day').gte('entry_date', previousYearStart);
  if (practitionerId) query = query.eq('practitioner_id', practitionerId);
  const { data, error } = await query;
  if (error) throw error;

  const now = new Date();
  const monthStart = toISODate(startOfMonth(now));
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthStart = toISODate(startOfMonth(previousMonthDate));
  const previousMonthEnd = toISODate(startOfMonth(now));
  const yearStart = toISODate(startOfYear(now));
  const previousYearEnd = yearStart;

  const result: RevenueComparison = {
    currentMonth: 0,
    previousMonth: 0,
    currentYear: 0,
    previousYear: 0,
    workedDaysThisMonth: 0,
    monthEvolutionPct: null,
  };

  for (const row of data) {
    const amount = Number(row.amount);
    if (row.entry_date >= yearStart) result.currentYear += amount;
    else if (row.entry_date < previousYearEnd) result.previousYear += amount;

    if (row.entry_date >= monthStart) {
      result.currentMonth += amount;
      if (row.worked_day) result.workedDaysThisMonth += 1;
    } else if (row.entry_date >= previousMonthStart && row.entry_date < previousMonthEnd) {
      result.previousMonth += amount;
    }
  }

  result.monthEvolutionPct = result.previousMonth > 0 ? ((result.currentMonth - result.previousMonth) / result.previousMonth) * 100 : null;
  return result;
}

/** §46 évolution CA : total par mois sur les N derniers mois — cabinet entier, ou un praticien si filtré depuis la vue Statistiques. */
export async function getMonthlyRevenueSeries(monthsBack = 6, practitionerId?: string | null): Promise<{ month: string; total: number }[]> {
  const start = new Date();
  start.setDate(1);
  start.setMonth(start.getMonth() - (monthsBack - 1));
  start.setHours(0, 0, 0, 0);

  let query = supabase.from('revenue_entries').select('entry_date, amount').gte('entry_date', toISODate(start));
  if (practitionerId) query = query.eq('practitioner_id', practitionerId);
  const { data, error } = await query;
  if (error) throw error;

  const totals = new Map<string, number>();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    totals.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
  }
  for (const row of data) {
    const key = row.entry_date.slice(0, 7);
    if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + Number(row.amount));
  }
  return Array.from(totals.entries()).map(([month, total]) => ({ month, total }));
}

export interface RevenueMonthSummary {
  total: number;
  workedDays: number;
  patientCount: number;
  avgPerWorkedDay: number | null;
}

async function computeMonthSummary(year: number, month: number, practitionerId?: string | null): Promise<RevenueMonthSummary> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  let query = supabase.from('revenue_entries').select('amount, worked_day, patient_count').gte('entry_date', toISODate(start)).lt('entry_date', toISODate(end));
  if (practitionerId) query = query.eq('practitioner_id', practitionerId);
  const { data, error } = await query;
  if (error) throw error;

  let total = 0;
  let workedDays = 0;
  let patientCount = 0;
  for (const row of data) {
    total += Number(row.amount);
    if (row.worked_day) workedDays += 1;
    patientCount += row.patient_count ?? 0;
  }
  return { total, workedDays, patientCount, avgPerWorkedDay: workedDays > 0 ? total / workedDays : null };
}

export interface RevenueMonthComparison {
  current: RevenueMonthSummary;
  previousMonth: RevenueMonthSummary;
  sameMonthLastYear: RevenueMonthSummary;
}

/** §46 navigation CA par mois : un mois arbitraire (pas forcément le mois en cours), avec comparaison au mois précédent et au même mois l'an dernier. */
export async function getRevenueMonthComparison(year: number, month: number, practitionerId?: string | null): Promise<RevenueMonthComparison> {
  const prevDate = new Date(year, month - 2, 1);
  const [current, previousMonth, sameMonthLastYear] = await Promise.all([
    computeMonthSummary(year, month, practitionerId),
    computeMonthSummary(prevDate.getFullYear(), prevDate.getMonth() + 1, practitionerId),
    computeMonthSummary(year - 1, month, practitionerId),
  ]);
  return { current, previousMonth, sameMonthLastYear };
}

/** §46 navigation CA par mois : liste des entrées du mois choisi (pas les N plus récentes toutes périodes confondues). */
export async function listRevenueEntriesForMonth(year: number, month: number, practitionerId?: string | null) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  let query = supabase
    .from('revenue_entries')
    .select('*')
    .gte('entry_date', toISODate(start))
    .lt('entry_date', toISODate(end))
    .order('entry_date', { ascending: false });
  if (practitionerId) query = query.eq('practitioner_id', practitionerId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function listRevenueEntryDetails(revenueEntryId: string) {
  const { data, error } = await supabase.from('revenue_entry_details').select('*').eq('revenue_entry_id', revenueEntryId);
  if (error) throw error;
  return data;
}

/** Remplace toute la décomposition par type d'acte d'une ligne de CA — plus simple et sûr qu'un diff ligne à ligne pour un petit nombre de lignes (§46). */
export async function replaceRevenueEntryDetails(revenueEntryId: string, details: { procedureType: RevenueEntryDetailRow['procedure_type']; amount: number }[]) {
  const { error: deleteError } = await supabase.from('revenue_entry_details').delete().eq('revenue_entry_id', revenueEntryId);
  if (deleteError) throw deleteError;
  if (details.length === 0) return;
  const { error: insertError } = await supabase
    .from('revenue_entry_details')
    .insert(details.map((d) => ({ revenue_entry_id: revenueEntryId, procedure_type: d.procedureType, amount: d.amount })));
  if (insertError) throw insertError;
}

/** §46 CA par praticien sur le mois en cours (pour le graphique, distinct de la vue "aujourd'hui" du dashboard). */
export async function getMonthlyRevenueByPractitioner(): Promise<PractitionerRevenueToday[]> {
  const [{ data: practitioners, error: practitionersError }, { data: entries, error: entriesError }] = await Promise.all([
    supabase.from('practitioners').select('id, first_name, last_name, color').eq('status', 'active'),
    supabase.from('revenue_entries').select('practitioner_id, amount').gte('entry_date', toISODate(startOfMonth())),
  ]);
  if (practitionersError) throw practitionersError;
  if (entriesError) throw entriesError;

  const amountByPractitioner = new Map<string, number>();
  for (const entry of entries) {
    amountByPractitioner.set(entry.practitioner_id, (amountByPractitioner.get(entry.practitioner_id) ?? 0) + Number(entry.amount));
  }
  return practitioners.map((practitioner) => ({ ...practitioner, amount: amountByPractitioner.get(practitioner.id) ?? 0 }));
}
