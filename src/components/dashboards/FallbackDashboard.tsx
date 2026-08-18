import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Card, ScreenContainer } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatCurrency } from '@/lib/format';
import { usePermissions } from '@/permissions/usePermissions';
import { listRecentExpenses } from '@/services/expenses';
import { listPinnedPostIts } from '@/services/postIts';
import { listTodayAndOverdueTasks } from '@/services/tasks';

import { DashboardSection } from './DashboardSection';
import { PostItListItem } from './PostItListItem';
import { SectionLink } from './SectionLink';
import { TaskListItem } from './TaskListItem';

/**
 * Dashboard générique pour secrétariat/comptable — ces rôles n'ont pas de
 * maquette dédiée dans le cahier des charges (§20-22 ne couvrent que
 * Assistante/Collaborateur/Titulaire). S'adapte aux permissions réellement
 * accordées plutôt que de supposer un accès par défaut, en particulier pour
 * le comptable qui n'a aucune permission tant que le titulaire ne lui en a
 * pas accordé (§15).
 */
export function FallbackDashboard() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const { can } = usePermissions();

  const tasksQuery = useQuery({ queryKey: ['dashboard-tasks-today'], queryFn: () => listTodayAndOverdueTasks() });
  const postItsQuery = useQuery({ queryKey: ['dashboard-pinned-post-its'], queryFn: () => listPinnedPostIts() });
  const canViewExpenses = can(PERMISSIONS.VIEW_EXPENSES);
  const expensesQuery = useQuery({
    queryKey: ['dashboard-recent-expenses'],
    queryFn: () => listRecentExpenses(),
    enabled: canViewExpenses,
  });

  return (
    <ScreenContainer>
      <View>
        <Text style={[styles.greeting, { color: theme.textMuted }]}>Bonjour</Text>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{profile?.first_name}</Text>
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
        title="Tâches du jour"
        isLoading={tasksQuery.isLoading}
        isEmpty={tasksQuery.data?.length === 0}
        emptyLabel="Aucune tâche en attente">
        <View style={styles.list}>
          {tasksQuery.data?.map((task) => (
            <TaskListItem key={task.id} task={task} />
          ))}
        </View>
      </DashboardSection>

      {canViewExpenses ? (
        <DashboardSection title="Dépenses récentes" isLoading={expensesQuery.isLoading} isEmpty={expensesQuery.data?.length === 0}>
          <View style={styles.list}>
            {expensesQuery.data?.map((expense) => (
              <Card key={expense.id} style={styles.row}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {expense.comment ?? expense.category}
                </Text>
                <Text style={[styles.amount, { color: theme.textPrimary }]}>{formatCurrency(Number(expense.amount))}</Text>
              </Card>
            ))}
          </View>
        </DashboardSection>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: typography.size.base },
  name: { fontSize: typography.size.xl3, fontWeight: typography.weight.bold },
  postItRow: { gap: spacing.md, paddingRight: spacing.lg },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  itemTitle: { flex: 1, fontSize: typography.size.base, fontWeight: typography.weight.medium },
  amount: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
});
