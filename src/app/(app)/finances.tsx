import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { BarChart } from '@/components/finance/BarChart';
import { ExpenseFormSheet, type ExpenseFormValues } from '@/components/finance/ExpenseFormSheet';
import { RevenueEntryFormSheet } from '@/components/finance/RevenueEntryFormSheet';
import { ScanReceiptSheet } from '@/components/finance/ScanReceiptSheet';
import { TargetFormSheet } from '@/components/finance/TargetFormSheet';
import { Badge, Card, ChipSelect, Divider, EmptyState, LoadingState, PickerField, ProgressBar, ScreenContainer, StatTile } from '@/components/ui';
import { EXPENSE_CATEGORY_LABEL, PAYMENT_METHOD_OPTIONS, TARGET_PERIOD_LABEL } from '@/constants/financeLabels';
import { PERMISSIONS } from '@/constants/permissions';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { rowsToCsv, shareCsv } from '@/lib/csv';
import { findClosestMatch } from '@/lib/duplicateDetection';
import { formatCurrency, formatDate, toISODate } from '@/lib/format';
import { usePermissions } from '@/permissions/usePermissions';
import type { ExtractedExpense } from '@/services/aiExtraction';
import { getExpensesByCategoryThisMonth, getExpensesThisMonthTotal, getMonthlyExpensesSeries, listAllExpenses } from '@/services/expenses';
import {
  getCabinetMonthlyTarget,
  getCabinetRevenueSummaryFull,
  getMonthlyRevenueByPractitioner,
  getMonthlyRevenueSeries,
  getRevenueComparison,
  getRevenueMonthComparison,
  listActivePractitioners,
  listRevenueEntriesForMonth,
  listTargetsWithActuals,
  type TargetWithActual,
} from '@/services/revenue';
import { listSuppliers } from '@/services/suppliers';
import type { ExpenseRow, RevenueEntryRow } from '@/types/database';

type FinanceView = 'apercu' | 'ca' | 'objectifs' | 'depenses' | 'statistiques';

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'short' });
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '');
}

function monthYearLabel(year: number, month: number): string {
  const label = new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function evolutionPct(current: number, base: number): number | null {
  return base > 0 ? ((current - base) / base) * 100 : null;
}

export default function FinancesScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const { can } = usePermissions();
  const queryClient = useQueryClient();

  const canViewAccounting = can(PERMISSIONS.VIEW_ACCOUNTING);
  const canViewAllRevenue = can(PERMISSIONS.VIEW_ALL_REVENUE);
  const canViewOwnRevenue = can(PERMISSIONS.VIEW_OWN_REVENUE);
  const canManageRevenue = can(PERMISSIONS.MANAGE_REVENUE);
  const canViewExpenses = can(PERMISSIONS.VIEW_EXPENSES);
  const canManageExpenses = can(PERMISSIONS.MANAGE_EXPENSES);
  const canSeeRevenue = canViewAllRevenue || canViewOwnRevenue;

  const availableViews = useMemo(
    () =>
      [
        canViewAccounting ? { value: 'apercu' as const, label: 'Aperçu' } : null,
        canSeeRevenue ? { value: 'ca' as const, label: 'CA' } : null,
        canSeeRevenue ? { value: 'objectifs' as const, label: 'Objectifs' } : null,
        canViewExpenses ? { value: 'depenses' as const, label: 'Dépenses' } : null,
        canViewAccounting ? { value: 'statistiques' as const, label: 'Statistiques' } : null,
      ].filter((v): v is { value: FinanceView; label: string } => v !== null),
    [canViewAccounting, canSeeRevenue, canViewExpenses]
  );

  const [view, setView] = useState<FinanceView>(() => availableViews[0]?.value ?? 'apercu');
  const [practitionerFilter, setPractitionerFilter] = useState<string | null>(canViewAllRevenue ? null : (profile?.practitioner_id ?? null));
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1;

  function goToPreviousMonth() {
    const d = new Date(selectedYear, selectedMonth - 2, 1);
    setSelectedYear(d.getFullYear());
    setSelectedMonth(d.getMonth() + 1);
  }
  function goToNextMonth() {
    if (isCurrentMonth) return;
    const d = new Date(selectedYear, selectedMonth, 1);
    setSelectedYear(d.getFullYear());
    setSelectedMonth(d.getMonth() + 1);
  }

  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RevenueEntryRow | undefined>(undefined);
  const [targetFormOpen, setTargetFormOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetWithActual | undefined>(undefined);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRow | undefined>(undefined);
  const [scanSheetOpen, setScanSheetOpen] = useState(false);
  const [expensePrefill, setExpensePrefill] = useState<Partial<ExpenseFormValues> | undefined>(undefined);
  const [unmatchedSupplierName, setUnmatchedSupplierName] = useState<string | null>(null);

  // Chargée d'avance (pas seulement quand le sheet dépense est ouvert) : il
  // faut la liste déjà en cache au moment où le scan IA revient, pour
  // pouvoir rapprocher le nom extrait sans attendre un nouveau fetch.
  const scanSuppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: listSuppliers, enabled: canManageExpenses });

  function handleReceiptExtracted(draft: ExtractedExpense, photoUri: string) {
    setScanSheetOpen(false);
    setEditingExpense(undefined);
    // Rapprochement flou du nom extrait avec un fournisseur existant (même
    // logique que les doublons de stock) : lié directement si trouvé ; sinon
    // proposé à la création (voir ExpenseFormSheet) et laissé en commentaire
    // en filet de sécurité — jamais perdu, jamais deviné à tort silencieusement.
    const supplierMatch = draft.supplierName ? findClosestMatch(draft.supplierName, scanSuppliersQuery.data ?? [], (s) => s.name) : null;
    setUnmatchedSupplierName(supplierMatch ? null : draft.supplierName);
    setExpensePrefill({
      amount: draft.amount != null ? String(draft.amount) : '',
      expenseDate: draft.expenseDate ?? toISODate(new Date()),
      category: draft.category,
      supplierId: supplierMatch ? supplierMatch.item.id : null,
      comment: [supplierMatch ? null : draft.supplierName, draft.comment].filter(Boolean).join(' — '),
      photoUrl: photoUri,
    });
    setExpenseFormOpen(true);
  }

  // Reprend catégorie/fournisseur/montant/moyen de paiement (le plus souvent
  // identiques d'une occurrence à l'autre pour une dépense récurrente) ;
  // date repart sur aujourd'hui, pas de justificatif reporté — un nouveau
  // paiement appelle son propre justificatif, jamais celui de l'ancien.
  function handleDuplicateExpense(expense: ExpenseRow) {
    setUnmatchedSupplierName(null);
    setEditingExpense(undefined);
    setExpensePrefill({
      amount: String(expense.amount),
      category: expense.category,
      supplierId: expense.supplier_id,
      paymentMethod: expense.payment_method ?? '',
      comment: expense.comment ?? '',
    });
    setExpenseFormOpen(true);
  }

  const cabinetTargetQuery = useQuery({ queryKey: ['finances-cabinet-target'], queryFn: getCabinetMonthlyTarget, enabled: view === 'apercu' });
  const monthCaQuery = useQuery({ queryKey: ['finances-cabinet-summary'], queryFn: getCabinetRevenueSummaryFull, enabled: view === 'apercu' });
  const monthExpensesQuery = useQuery({ queryKey: ['finances-expenses-month-total'], queryFn: getExpensesThisMonthTotal, enabled: view === 'apercu' });
  const expensesByCategoryQuery = useQuery({
    queryKey: ['finances-expenses-by-category'],
    queryFn: getExpensesByCategoryThisMonth,
    enabled: view === 'apercu' || view === 'statistiques',
  });

  const practitionersQuery = useQuery({
    queryKey: ['practitioners-active'],
    queryFn: listActivePractitioners,
    enabled: (view === 'ca' || view === 'statistiques') && canViewAllRevenue,
  });
  const monthComparisonQuery = useQuery({
    queryKey: ['finances-month-comparison', selectedYear, selectedMonth, practitionerFilter],
    queryFn: () => getRevenueMonthComparison(selectedYear, selectedMonth, practitionerFilter),
    enabled: view === 'ca',
  });
  const monthEntriesQuery = useQuery({
    queryKey: ['finances-month-entries', selectedYear, selectedMonth, practitionerFilter],
    queryFn: () => listRevenueEntriesForMonth(selectedYear, selectedMonth, practitionerFilter),
    enabled: view === 'ca',
  });
  // Statistiques garde sa propre carte "vs mois en cours" (toujours relative à aujourd'hui), distincte de la navigation par mois de la vue CA.
  const comparisonQuery = useQuery({
    queryKey: ['finances-comparison', practitionerFilter],
    queryFn: () => getRevenueComparison(practitionerFilter),
    enabled: view === 'statistiques',
  });

  const targetsQuery = useQuery({ queryKey: ['finances-targets'], queryFn: () => listTargetsWithActuals(), enabled: view === 'objectifs' });

  const expensesQuery = useQuery({ queryKey: ['finances-expenses-all'], queryFn: () => listAllExpenses(), enabled: view === 'depenses' });

  const monthlySeriesQuery = useQuery({
    queryKey: ['finances-monthly-series', practitionerFilter],
    queryFn: () => getMonthlyRevenueSeries(6, practitionerFilter),
    enabled: view === 'statistiques',
  });
  const byPractitionerQuery = useQuery({
    queryKey: ['finances-by-practitioner'],
    queryFn: getMonthlyRevenueByPractitioner,
    enabled: view === 'statistiques' && !practitionerFilter,
  });
  const expensesSeriesQuery = useQuery({
    queryKey: ['finances-expenses-series', categoryFilter],
    queryFn: () => getMonthlyExpensesSeries(6, categoryFilter as ExpenseRow['category'] | null),
    enabled: view === 'statistiques',
  });

  const paymentMethodLabel = Object.fromEntries(PAYMENT_METHOD_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;

  async function handleExportCa() {
    const rows = (monthEntriesQuery.data ?? []).map((entry) => [
      formatDate(entry.entry_date),
      practitionerNameById.get(entry.practitioner_id) ?? '',
      Number(entry.amount),
      entry.patient_count ?? '',
      entry.comment ?? '',
    ]);
    const csv = rowsToCsv(['Date', 'Praticien', 'Montant', 'Patients', 'Commentaire'], rows);
    await shareCsv(`ca-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`, csv);
  }

  async function handleExportExpenses() {
    const rows = (expensesQuery.data ?? []).map((expense) => [
      formatDate(expense.expense_date),
      EXPENSE_CATEGORY_LABEL[expense.category],
      Number(expense.amount),
      expense.payment_method ? (paymentMethodLabel[expense.payment_method] ?? expense.payment_method) : '',
      expense.comment ?? '',
    ]);
    const csv = rowsToCsv(['Date', 'Catégorie', 'Montant', 'Moyen de paiement', 'Commentaire'], rows);
    await shareCsv('depenses.csv', csv);
  }

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['finances-month-comparison'] });
    queryClient.invalidateQueries({ queryKey: ['finances-month-entries'] });
    queryClient.invalidateQueries({ queryKey: ['finances-comparison'] });
    queryClient.invalidateQueries({ queryKey: ['finances-targets'] });
    queryClient.invalidateQueries({ queryKey: ['finances-expenses-all'] });
    queryClient.invalidateQueries({ queryKey: ['finances-expenses-month-total'] });
    queryClient.invalidateQueries({ queryKey: ['finances-expenses-by-category'] });
    queryClient.invalidateQueries({ queryKey: ['finances-cabinet-summary'] });
    queryClient.invalidateQueries({ queryKey: ['finances-cabinet-target'] });
    queryClient.invalidateQueries({ queryKey: ['finances-monthly-series'] });
    queryClient.invalidateQueries({ queryKey: ['finances-by-practitioner'] });
    queryClient.invalidateQueries({ queryKey: ['finances-expenses-series'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-cabinet-revenue'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-cabinet-target'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-revenue-per-practitioner'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-recent-expenses'] });
    queryClient.invalidateQueries({ queryKey: ['my-revenue-history'] });
  }

  const practitionerOptions = [{ value: '', label: 'Tous les praticiens' }, ...(practitionersQuery.data ?? []).map((p) => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))];
  const practitionerNameById = new Map((practitionersQuery.data ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`]));
  const categoryOptions = [
    { value: '', label: 'Toutes catégories' },
    ...(Object.entries(EXPENSE_CATEGORY_LABEL) as [string, string][]).map(([value, label]) => ({ value, label })),
  ];
  const selectedPractitionerName = practitionerFilter ? (practitionerNameById.get(practitionerFilter) ?? null) : null;
  const selectedCategoryName = categoryFilter ? (EXPENSE_CATEGORY_LABEL[categoryFilter as ExpenseRow['category']] ?? null) : null;
  const newEntryDefaultDate = isCurrentMonth ? undefined : toISODate(new Date(selectedYear, selectedMonth - 1, 1));
  const vsPreviousMonthPct = evolutionPct(monthComparisonQuery.data?.current.total ?? 0, monthComparisonQuery.data?.previousMonth.total ?? 0);
  const vsLastYearPct = evolutionPct(monthComparisonQuery.data?.current.total ?? 0, monthComparisonQuery.data?.sameMonthLastYear.total ?? 0);

  if (!profile) return null;

  if (availableViews.length === 0) {
    return (
      <ScreenContainer>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Finances</Text>
        <EmptyState title="Aucun accès" description="Tu n'as pas encore de permission financière. Demande à un titulaire de t'en accorder si nécessaire." />
      </ScreenContainer>
    );
  }

  const targetAmount = cabinetTargetQuery.data ? Number(cabinetTargetQuery.data.target_amount) : null;
  const monthRevenue = monthCaQuery.data?.month ?? 0;
  const monthExpenses = monthExpensesQuery.data ?? 0;
  const targetProgress = targetAmount && targetAmount > 0 ? monthRevenue / targetAmount : null;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Finances</Text>
        {view === 'ca' ? (
          <View style={styles.headerActions}>
            {canSeeRevenue ? (
              <Pressable
                onPress={handleExportCa}
                accessibilityRole="button"
                accessibilityLabel="Exporter le CA du mois en CSV"
                style={[styles.addButton, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="share-outline" size={20} color={theme.textPrimary} />
              </Pressable>
            ) : null}
            {canManageRevenue ? (
              <Pressable
                onPress={() => {
                  setEditingEntry(undefined);
                  setEntryFormOpen(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Nouveau CA"
                style={[styles.addButton, { backgroundColor: theme.primary }]}>
                <Ionicons name="add" size={24} color={theme.textOnPrimary} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {view === 'objectifs' && canManageRevenue ? (
          <Pressable
            onPress={() => {
              setEditingTarget(undefined);
              setTargetFormOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Nouvel objectif"
            style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={24} color={theme.textOnPrimary} />
          </Pressable>
        ) : null}
        {view === 'depenses' ? (
          <View style={styles.headerActions}>
            {canViewExpenses ? (
              <Pressable
                onPress={handleExportExpenses}
                accessibilityRole="button"
                accessibilityLabel="Exporter les dépenses en CSV"
                style={[styles.addButton, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="share-outline" size={20} color={theme.textPrimary} />
              </Pressable>
            ) : null}
            {canManageExpenses ? (
              <>
                <Pressable
                  onPress={() => setScanSheetOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Scanner une facture"
                  style={[styles.addButton, { backgroundColor: theme.surfaceAlt }]}>
                  <Ionicons name="camera-outline" size={22} color={theme.textPrimary} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    setEditingExpense(undefined);
                    setExpensePrefill(undefined);
                    setUnmatchedSupplierName(null);
                    setExpenseFormOpen(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Nouvelle dépense"
                  style={[styles.addButton, { backgroundColor: theme.primary }]}>
                  <Ionicons name="add" size={24} color={theme.textOnPrimary} />
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}
      </View>

      {availableViews.length > 1 ? <ChipSelect label="Vue" options={availableViews} value={view} onChange={setView} /> : null}

      {view === 'apercu' ? (
        <>
          <View style={styles.statsGrid}>
            <StatTile label="CA ce mois" value={monthCaQuery.isLoading ? '…' : formatCurrency(monthRevenue)} />
            <StatTile label="Dépenses ce mois" value={monthExpensesQuery.isLoading ? '…' : formatCurrency(monthExpenses)} tone="warning" />
          </View>
          <StatTile
            label="Solde du mois"
            value={monthCaQuery.isLoading || monthExpensesQuery.isLoading ? '…' : formatCurrency(monthRevenue - monthExpenses)}
            tone={monthRevenue - monthExpenses >= 0 ? 'success' : 'danger'}
          />

          <Card>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Objectif du cabinet — ce mois</Text>
            {targetAmount ? (
              <>
                <View style={styles.targetRow}>
                  <Text style={[styles.targetValue, { color: theme.textPrimary }]}>{formatCurrency(monthRevenue)}</Text>
                  <Text style={[styles.targetGoal, { color: theme.textMuted }]}> / {formatCurrency(targetAmount)}</Text>
                </View>
                <ProgressBar progress={targetProgress ?? 0} tone={(targetProgress ?? 0) >= 1 ? 'success' : (targetProgress ?? 0) >= 0.6 ? 'info' : 'warning'} />
              </>
            ) : (
              <Text style={{ color: theme.textMuted }}>Aucun objectif défini pour ce mois.</Text>
            )}
          </Card>

          <Card>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Dépenses par catégorie — ce mois</Text>
            {expensesByCategoryQuery.isLoading ? (
              <LoadingState label="Chargement..." />
            ) : (
              <BarChart
                data={(expensesByCategoryQuery.data ?? []).slice(0, 5).map((row) => ({ label: EXPENSE_CATEGORY_LABEL[row.category], value: row.total }))}
                formatValue={formatCurrency}
                emptyLabel="Aucune dépense ce mois"
              />
            )}
          </Card>
        </>
      ) : null}

      {view === 'ca' ? (
        <>
          {canViewAllRevenue ? (
            <PickerField label="Praticien" options={practitionerOptions} value={practitionerFilter ?? ''} onChange={(v) => setPractitionerFilter(v || null)} />
          ) : null}

          <View style={styles.periodNav}>
            <Pressable onPress={goToPreviousMonth} accessibilityRole="button" accessibilityLabel="Mois précédent" hitSlop={8} style={styles.periodNavButton}>
              <Ionicons name="chevron-back" size={22} color={theme.textSecondary} />
            </Pressable>
            <Text style={[styles.periodLabel, { color: theme.textPrimary }]}>{monthYearLabel(selectedYear, selectedMonth)}</Text>
            <Pressable
              onPress={goToNextMonth}
              disabled={isCurrentMonth}
              accessibilityRole="button"
              accessibilityLabel="Mois suivant"
              hitSlop={8}
              style={styles.periodNavButton}>
              <Ionicons name="chevron-forward" size={22} color={isCurrentMonth ? theme.textMuted : theme.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.statsGrid}>
            <StatTile label="CA du mois" value={monthComparisonQuery.isLoading ? '…' : formatCurrency(monthComparisonQuery.data?.current.total ?? 0)} />
            <StatTile label="Jours travaillés" value={monthComparisonQuery.isLoading ? '…' : String(monthComparisonQuery.data?.current.workedDays ?? 0)} />
            <StatTile label="Patients" value={monthComparisonQuery.isLoading ? '…' : String(monthComparisonQuery.data?.current.patientCount ?? 0)} />
            <StatTile
              label="CA moyen / jour travaillé"
              value={monthComparisonQuery.isLoading ? '…' : formatCurrency(monthComparisonQuery.data?.current.avgPerWorkedDay ?? 0)}
            />
          </View>

          <Card>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Comparaisons</Text>
            <View style={styles.compareRow}>
              <Text style={[styles.compareLabel, { color: theme.textSecondary }]}>Mois précédent</Text>
              <Text style={[styles.compareValue, { color: theme.textPrimary }]}>
                {monthComparisonQuery.isLoading ? '…' : formatCurrency(monthComparisonQuery.data?.previousMonth.total ?? 0)}
              </Text>
            </View>
            <View style={styles.compareRow}>
              <Text style={[styles.compareLabel, { color: theme.textSecondary }]}>Évolution vs mois précédent</Text>
              <Text style={[styles.compareValue, { color: (vsPreviousMonthPct ?? 0) >= 0 ? theme.success : theme.danger }]}>
                {monthComparisonQuery.isLoading || vsPreviousMonthPct == null ? '—' : `${vsPreviousMonthPct >= 0 ? '+' : ''}${vsPreviousMonthPct.toFixed(0)}%`}
              </Text>
            </View>
            <View style={styles.compareRow}>
              <Text style={[styles.compareLabel, { color: theme.textSecondary }]}>Même mois, année précédente</Text>
              <Text style={[styles.compareValue, { color: theme.textPrimary }]}>
                {monthComparisonQuery.isLoading ? '…' : formatCurrency(monthComparisonQuery.data?.sameMonthLastYear.total ?? 0)}
              </Text>
            </View>
            <View style={styles.compareRow}>
              <Text style={[styles.compareLabel, { color: theme.textSecondary }]}>Évolution vs l&apos;an dernier</Text>
              <Text style={[styles.compareValue, { color: (vsLastYearPct ?? 0) >= 0 ? theme.success : theme.danger }]}>
                {monthComparisonQuery.isLoading || vsLastYearPct == null ? '—' : `${vsLastYearPct >= 0 ? '+' : ''}${vsLastYearPct.toFixed(0)}%`}
              </Text>
            </View>
          </Card>

          <Divider spacing={0} />

          {monthEntriesQuery.isLoading ? (
            <LoadingState />
          ) : monthEntriesQuery.data?.length === 0 ? (
            <EmptyState title="Aucune entrée de CA ce mois-ci" />
          ) : (
            <View style={styles.list}>
              {monthEntriesQuery.data?.map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={() => {
                    if (!canManageRevenue) return;
                    setEditingEntry(entry);
                    setEntryFormOpen(true);
                  }}>
                  <Card style={styles.row}>
                    <View style={styles.flex1}>
                      <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                        {formatDate(entry.entry_date)}
                        {!practitionerFilter && practitionerNameById.get(entry.practitioner_id) ? ` · ${practitionerNameById.get(entry.practitioner_id)}` : ''}
                      </Text>
                      {entry.patient_count ? <Text style={[styles.itemHint, { color: theme.textMuted }]}>{entry.patient_count} patient(s)</Text> : null}
                    </View>
                    <Text style={[styles.amount, { color: theme.textPrimary }]}>{formatCurrency(Number(entry.amount))}</Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </>
      ) : null}

      {view === 'objectifs' ? (
        targetsQuery.isLoading ? (
          <LoadingState />
        ) : targetsQuery.data?.length === 0 ? (
          <EmptyState title="Aucun objectif défini" />
        ) : (
          <View style={styles.list}>
            {targetsQuery.data?.map((target) => {
              const progress = target.target_amount > 0 ? target.actual / Number(target.target_amount) : 0;
              return (
                <Pressable
                  key={target.id}
                  onPress={() => {
                    if (!canManageRevenue) return;
                    setEditingTarget(target);
                    setTargetFormOpen(true);
                  }}>
                  <Card>
                    <View style={styles.rowBetween}>
                      <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                        {target.practitioner_id ? practitionerNameById.get(target.practitioner_id) || 'Praticien' : 'Cabinet entier'}
                      </Text>
                      <Badge label={`${TARGET_PERIOD_LABEL[target.period_type]} · ${formatDate(target.period_start)}`} tone="neutral" />
                    </View>
                    <View style={styles.targetRow}>
                      <Text style={[styles.targetValue, { color: theme.textPrimary }]}>{formatCurrency(target.actual)}</Text>
                      <Text style={[styles.targetGoal, { color: theme.textMuted }]}> / {formatCurrency(Number(target.target_amount))}</Text>
                    </View>
                    <ProgressBar progress={progress} tone={progress >= 1 ? 'success' : progress >= 0.6 ? 'info' : 'warning'} />
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )
      ) : null}

      {view === 'depenses' ? (
        expensesQuery.isLoading ? (
          <LoadingState />
        ) : expensesQuery.data?.length === 0 ? (
          <EmptyState title="Aucune dépense" />
        ) : (
          <View style={styles.list}>
            {expensesQuery.data?.map((expense) => (
              <Pressable
                key={expense.id}
                onPress={() => {
                  if (!canManageExpenses) return;
                  setEditingExpense(expense);
                  setExpensePrefill(undefined);
                  setUnmatchedSupplierName(null);
                  setExpenseFormOpen(true);
                }}>
                <Card style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {expense.comment || EXPENSE_CATEGORY_LABEL[expense.category]}
                    </Text>
                    <Text style={[styles.itemHint, { color: theme.textMuted }]}>
                      {formatDate(expense.expense_date)} · {EXPENSE_CATEGORY_LABEL[expense.category]}
                    </Text>
                  </View>
                  <Text style={[styles.amount, { color: theme.textPrimary }]}>{formatCurrency(Number(expense.amount))}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      {view === 'statistiques' ? (
        <>
          {canViewAllRevenue || canViewExpenses ? (
            <Card>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Filtres</Text>
              {canViewAllRevenue ? (
                <PickerField label="Praticien" options={practitionerOptions} value={practitionerFilter ?? ''} onChange={(v) => setPractitionerFilter(v || null)} />
              ) : null}
              {canViewExpenses ? (
                <PickerField label="Catégorie de dépense" options={categoryOptions} value={categoryFilter ?? ''} onChange={(v) => setCategoryFilter(v || null)} />
              ) : null}
            </Card>
          ) : null}

          <Card>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Évolution du CA (6 derniers mois){selectedPractitionerName ? ` — ${selectedPractitionerName}` : ''}
            </Text>
            {monthlySeriesQuery.isLoading ? (
              <LoadingState label="Chargement..." />
            ) : (
              <BarChart data={(monthlySeriesQuery.data ?? []).map((row) => ({ label: monthLabel(row.month), value: row.total }))} formatValue={formatCurrency} />
            )}
          </Card>

          {/* Redondant une fois filtré sur un seul praticien : la carte ci-dessus devient déjà spécifique à ce praticien. */}
          {!practitionerFilter ? (
            <Card>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>CA par praticien — ce mois</Text>
              {byPractitionerQuery.isLoading ? (
                <LoadingState label="Chargement..." />
              ) : (
                <BarChart
                  data={(byPractitionerQuery.data ?? []).map((p) => ({ label: `${p.first_name} ${p.last_name}`, value: p.amount, color: p.color }))}
                  formatValue={formatCurrency}
                />
              )}
            </Card>
          ) : null}

          <Card>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Dépenses par catégorie — ce mois</Text>
            {expensesByCategoryQuery.isLoading ? (
              <LoadingState label="Chargement..." />
            ) : (
              <BarChart data={(expensesByCategoryQuery.data ?? []).map((row) => ({ label: EXPENSE_CATEGORY_LABEL[row.category], value: row.total }))} formatValue={formatCurrency} />
            )}
          </Card>

          <Card>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Évolution des dépenses (6 derniers mois){selectedCategoryName ? ` — ${selectedCategoryName}` : ''}
            </Text>
            {expensesSeriesQuery.isLoading ? (
              <LoadingState label="Chargement..." />
            ) : (
              <BarChart data={(expensesSeriesQuery.data ?? []).map((row) => ({ label: monthLabel(row.month), value: row.total }))} formatValue={formatCurrency} />
            )}
          </Card>

          <Card>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Comparaison mensuelle{selectedPractitionerName ? ` — ${selectedPractitionerName}` : ''}
            </Text>
            {comparisonQuery.isLoading ? (
              <LoadingState label="Chargement..." />
            ) : (
              <BarChart
                data={[
                  { label: 'Mois précédent', value: comparisonQuery.data?.previousMonth ?? 0 },
                  { label: 'Ce mois', value: comparisonQuery.data?.currentMonth ?? 0 },
                ]}
                formatValue={formatCurrency}
              />
            )}
          </Card>
        </>
      ) : null}

      <RevenueEntryFormSheet
        visible={entryFormOpen}
        onClose={() => setEntryFormOpen(false)}
        onSaved={() => {
          setEntryFormOpen(false);
          invalidateAll();
        }}
        entry={editingEntry}
        defaultPractitionerId={practitionerFilter ?? undefined}
        defaultDate={newEntryDefaultDate}
      />

      <TargetFormSheet
        visible={targetFormOpen}
        onClose={() => setTargetFormOpen(false)}
        onSaved={() => {
          setTargetFormOpen(false);
          invalidateAll();
        }}
        target={editingTarget}
      />

      <ExpenseFormSheet
        visible={expenseFormOpen}
        onClose={() => {
          setExpenseFormOpen(false);
          setExpensePrefill(undefined);
          setUnmatchedSupplierName(null);
        }}
        onSaved={() => {
          setExpenseFormOpen(false);
          setExpensePrefill(undefined);
          setUnmatchedSupplierName(null);
          invalidateAll();
        }}
        expense={editingExpense}
        prefill={expensePrefill}
        onDuplicate={handleDuplicateExpense}
        unmatchedSupplierName={unmatchedSupplierName}
      />

      <ScanReceiptSheet visible={scanSheetOpen} onClose={() => setScanSheetOpen(false)} onExtracted={handleReceiptExtracted} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  periodNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  periodNavButton: { padding: spacing.xs },
  periodLabel: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, minWidth: 160, textAlign: 'center' },
  cardTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, marginBottom: spacing.sm },
  targetRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.sm },
  targetValue: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  targetGoal: { fontSize: typography.size.base },
  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  compareLabel: { fontSize: typography.size.sm, flexShrink: 1 },
  compareValue: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  flex1: { flex: 1 },
  itemTitle: { fontSize: typography.size.base, fontWeight: typography.weight.medium, flexShrink: 1 },
  itemHint: { fontSize: typography.size.xs },
  amount: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
});
