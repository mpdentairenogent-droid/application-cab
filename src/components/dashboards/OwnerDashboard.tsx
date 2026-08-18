import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Card, ProgressBar, ScreenContainer, StatTile } from '@/components/ui';
import { EXPENSE_CATEGORY_LABEL } from '@/constants/financeLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatCurrency, formatDate } from '@/lib/format';
import { listOpenBreakdowns } from '@/services/equipment';
import { listRecentExpenses } from '@/services/expenses';
import { listPendingMaterialRequests } from '@/services/materialRequests';
import { getCabinetMonthlyTarget, getCabinetRevenueSummary, listPractitionersRevenueToday } from '@/services/revenue';
import { listStockAlerts } from '@/services/stock';
import { listTodayAndOverdueTasks } from '@/services/tasks';

import { DashboardSection } from './DashboardSection';
import { SectionLink } from './SectionLink';
import { TaskListItem } from './TaskListItem';

function AlertRow({ label, tone }: { label: string; tone: 'warning' | 'danger' | 'info' }) {
  const theme = useAppTheme();
  const color = { warning: theme.warning, danger: theme.danger, info: theme.info }[tone];
  const bg = { warning: theme.warningTint, danger: theme.dangerTint, info: theme.infoTint }[tone];
  return (
    <View style={[styles.alertRow, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.alertLabel, { color: theme.textPrimary }]}>{label}</Text>
    </View>
  );
}

export function OwnerDashboard() {
  const theme = useAppTheme();
  const { profile } = useAuth();

  const revenueQuery = useQuery({ queryKey: ['dashboard-cabinet-revenue'], queryFn: getCabinetRevenueSummary });
  const targetQuery = useQuery({ queryKey: ['dashboard-cabinet-target'], queryFn: getCabinetMonthlyTarget });
  const perPractitionerQuery = useQuery({ queryKey: ['dashboard-revenue-per-practitioner'], queryFn: listPractitionersRevenueToday });
  const expensesQuery = useQuery({ queryKey: ['dashboard-recent-expenses'], queryFn: () => listRecentExpenses() });
  const stockAlertsQuery = useQuery({ queryKey: ['dashboard-stock-alerts'], queryFn: listStockAlerts });
  const breakdownsQuery = useQuery({ queryKey: ['dashboard-breakdowns'], queryFn: () => listOpenBreakdowns() });
  const materialRequestsQuery = useQuery({ queryKey: ['dashboard-material-requests'], queryFn: () => listPendingMaterialRequests() });
  const tasksQuery = useQuery({ queryKey: ['dashboard-tasks-today'], queryFn: () => listTodayAndOverdueTasks() });

  const targetAmount = targetQuery.data ? Number(targetQuery.data.target_amount) : null;
  const monthRevenue = revenueQuery.data?.month ?? 0;
  const progress = targetAmount && targetAmount > 0 ? monthRevenue / targetAmount : null;
  const stockAlertCount = (stockAlertsQuery.data?.outOfStock.length ?? 0) + (stockAlertsQuery.data?.lowStock.length ?? 0);
  const breakdownCount = breakdownsQuery.data?.length ?? 0;
  const materialRequestCount = materialRequestsQuery.data?.length ?? 0;
  const alertCount = stockAlertCount + breakdownCount + materialRequestCount;

  return (
    <ScreenContainer>
      <View>
        <Text style={[styles.greeting, { color: theme.textMuted }]}>Bonjour</Text>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{profile?.first_name}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatTile label="CA aujourd'hui" value={revenueQuery.isLoading ? '…' : formatCurrency(revenueQuery.data?.today ?? 0)} />
        <StatTile label="CA ce mois" value={revenueQuery.isLoading ? '…' : formatCurrency(monthRevenue)} />
      </View>

      <Card>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Objectif du cabinet — ce mois</Text>
        {targetAmount ? (
          <>
            <View style={styles.targetRow}>
              <Text style={[styles.targetValue, { color: theme.textPrimary }]}>{formatCurrency(monthRevenue)}</Text>
              <Text style={[styles.targetGoal, { color: theme.textMuted }]}> / {formatCurrency(targetAmount)}</Text>
            </View>
            <ProgressBar progress={progress ?? 0} tone={(progress ?? 0) >= 1 ? 'success' : (progress ?? 0) >= 0.6 ? 'info' : 'warning'} />
            <Text style={[styles.progressLabel, { color: theme.textMuted }]}>{Math.round((progress ?? 0) * 100)}% de l&apos;objectif</Text>
          </>
        ) : (
          <Text style={{ color: theme.textMuted }}>Aucun objectif défini pour ce mois.</Text>
        )}
      </Card>

      <DashboardSection
        title="CA du jour par praticien"
        isLoading={perPractitionerQuery.isLoading}
        isEmpty={perPractitionerQuery.data?.length === 0}
        action={<SectionLink href="/finances" />}>
        <View style={styles.list}>
          {perPractitionerQuery.data?.map((practitioner) => (
            <Card key={practitioner.id} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: practitioner.color }]} />
              <Text style={[styles.itemTitle, styles.flex1, { color: theme.textPrimary }]} numberOfLines={1}>
                {practitioner.first_name} {practitioner.last_name}
              </Text>
              <Text style={[styles.amount, { color: theme.textPrimary }]}>{formatCurrency(practitioner.amount)}</Text>
            </Card>
          ))}
        </View>
      </DashboardSection>

      {alertCount > 0 ? (
        <DashboardSection title="Alertes">
          <View style={styles.list}>
            {stockAlertCount > 0 ? <AlertRow label={`${stockAlertCount} article(s) en stock faible ou en rupture`} tone="warning" /> : null}
            {breakdownCount > 0 ? <AlertRow label={`${breakdownCount} panne(s) en cours`} tone="danger" /> : null}
            {materialRequestCount > 0 ? <AlertRow label={`${materialRequestCount} demande(s) de matériel en attente`} tone="info" /> : null}
          </View>
        </DashboardSection>
      ) : null}

      <DashboardSection title="Dépenses récentes" isLoading={expensesQuery.isLoading} isEmpty={expensesQuery.data?.length === 0} action={<SectionLink href="/finances" />}>
        <View style={styles.list}>
          {expensesQuery.data?.map((expense) => (
            <Card key={expense.id} style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {expense.comment || EXPENSE_CATEGORY_LABEL[expense.category]}
                </Text>
                <Text style={[styles.itemHint, { color: theme.textMuted }]}>{formatDate(expense.expense_date)}</Text>
              </View>
              <Text style={[styles.amount, { color: theme.textPrimary }]}>{formatCurrency(Number(expense.amount))}</Text>
            </Card>
          ))}
        </View>
      </DashboardSection>

      <DashboardSection title="Tâches de l'équipe" isLoading={tasksQuery.isLoading} isEmpty={tasksQuery.data?.length === 0}>
        <View style={styles.list}>
          {tasksQuery.data?.slice(0, 5).map((task) => (
            <TaskListItem key={task.id} task={task} />
          ))}
        </View>
      </DashboardSection>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: typography.size.base },
  name: { fontSize: typography.size.xl3, fontWeight: typography.weight.bold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cardTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, marginBottom: spacing.sm },
  targetRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.sm },
  targetValue: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  targetGoal: { fontSize: typography.size.base },
  progressLabel: { fontSize: typography.size.xs, marginTop: spacing.xs },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  itemTitle: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  itemHint: { fontSize: typography.size.xs },
  amount: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: 12, padding: spacing.md },
  alertLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, flex: 1 },
});
