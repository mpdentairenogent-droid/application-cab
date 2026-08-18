import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Card, ProgressBar, ScreenContainer, StatTile } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatCurrency } from '@/lib/format';
import { listPinnedPostIts } from '@/services/postIts';
import { getPractitionerMonthlyTarget, getPractitionerRevenueSummary } from '@/services/revenue';
import { listTodayAndOverdueTasks } from '@/services/tasks';

import { DashboardSection } from './DashboardSection';
import { PostItListItem } from './PostItListItem';
import { SectionLink } from './SectionLink';
import { TaskListItem } from './TaskListItem';

export function CollaboratorDashboard() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const practitionerId = profile?.practitioner_id ?? null;

  const revenueQuery = useQuery({
    queryKey: ['dashboard-revenue-summary', practitionerId],
    queryFn: () => getPractitionerRevenueSummary(practitionerId as string),
    enabled: !!practitionerId,
  });
  const targetQuery = useQuery({
    queryKey: ['dashboard-revenue-target', practitionerId],
    queryFn: () => getPractitionerMonthlyTarget(practitionerId as string),
    enabled: !!practitionerId,
  });
  const tasksQuery = useQuery({ queryKey: ['dashboard-tasks-today'], queryFn: () => listTodayAndOverdueTasks() });
  const postItsQuery = useQuery({ queryKey: ['dashboard-pinned-post-its'], queryFn: () => listPinnedPostIts() });

  const monthRevenue = revenueQuery.data?.month ?? 0;
  const targetAmount = targetQuery.data ? Number(targetQuery.data.target_amount) : null;
  const progress = targetAmount && targetAmount > 0 ? monthRevenue / targetAmount : null;

  if (!practitionerId) {
    return (
      <ScreenContainer scroll={false} style={styles.noPractitioner}>
        <Text style={[styles.name, { color: theme.textPrimary }]}>Bonjour {profile?.first_name}</Text>
        <Text style={[styles.noPractitionerText, { color: theme.textSecondary }]}>
          Ton compte n&apos;est associé à aucun praticien pour le moment — contacte un titulaire pour faire suivre ton activité.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View>
        <Text style={[styles.greeting, { color: theme.textMuted }]}>Bonjour</Text>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{profile?.first_name}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatTile label="CA aujourd'hui" value={revenueQuery.isLoading ? '…' : formatCurrency(revenueQuery.data?.today ?? 0)} />
        <StatTile label="CA cette semaine" value={revenueQuery.isLoading ? '…' : formatCurrency(revenueQuery.data?.week ?? 0)} />
        <StatTile label="CA ce mois" value={revenueQuery.isLoading ? '…' : formatCurrency(monthRevenue)} />
        <StatTile label="CA cette année" value={revenueQuery.isLoading ? '…' : formatCurrency(revenueQuery.data?.year ?? 0)} />
      </View>

      <Card>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Objectif du mois</Text>
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

      <View style={styles.statsGrid}>
        <StatTile label="Jours travaillés" value={String(revenueQuery.data?.workedDaysThisMonth ?? 0)} hint="ce mois" tone="info" />
        <StatTile
          label="CA moyen / jour"
          value={
            revenueQuery.data && revenueQuery.data.workedDaysThisMonth > 0
              ? formatCurrency(revenueQuery.data.month / revenueQuery.data.workedDaysThisMonth)
              : formatCurrency(0)
          }
          tone="info"
        />
      </View>

      <DashboardSection
        title="Post-it importants"
        isLoading={postItsQuery.isLoading}
        isEmpty={postItsQuery.data?.length === 0}
        emptyLabel="Aucun Post-it épinglé"
        action={<SectionLink href="/post-its" />}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.postItRow}>
          {postItsQuery.data?.map((postIt) => (
            <PostItListItem key={postIt.id} postIt={postIt} />
          ))}
        </ScrollView>
      </DashboardSection>

      <DashboardSection
        title="Mes tâches"
        isLoading={tasksQuery.isLoading}
        isEmpty={tasksQuery.data?.length === 0}
        emptyLabel="Aucune tâche en attente"
        action={<SectionLink href="/tasks" />}>
        <View style={styles.list}>
          {tasksQuery.data?.map((task) => (
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
  noPractitioner: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  noPractitionerText: { textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cardTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, marginBottom: spacing.sm },
  targetRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.sm },
  targetValue: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  targetGoal: { fontSize: typography.size.base },
  progressLabel: { fontSize: typography.size.xs, marginTop: spacing.xs },
  postItRow: { gap: spacing.md, paddingRight: spacing.lg },
  list: { gap: spacing.sm },
});
