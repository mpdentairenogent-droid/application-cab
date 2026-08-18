import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Badge, Card, ScreenContainer, StatTile } from '@/components/ui';
import { URGENCY_LABEL as BREAKDOWN_URGENCY_LABEL, URGENCY_TONE as BREAKDOWN_URGENCY_TONE } from '@/constants/equipmentLabels';
import { URGENCY_LABEL, URGENCY_TONE } from '@/constants/stockLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDate, formatDateTime } from '@/lib/format';
import { listOpenBreakdowns } from '@/services/equipment';
import { listPendingMaterialRequests, summarizeRequestItems } from '@/services/materialRequests';
import { listPinnedPostIts } from '@/services/postIts';
import { listExpiringStock, listStockAlerts } from '@/services/stock';
import { listTodayCycles } from '@/services/sterilization';
import { listTodayAndOverdueTasks } from '@/services/tasks';

import { DashboardSection } from './DashboardSection';
import { PostItListItem } from './PostItListItem';
import { SectionLink } from './SectionLink';
import { TaskListItem } from './TaskListItem';

export function AssistantDashboard() {
  const theme = useAppTheme();
  const { profile } = useAuth();

  const tasksQuery = useQuery({ queryKey: ['dashboard-tasks-today'], queryFn: () => listTodayAndOverdueTasks() });
  const postItsQuery = useQuery({ queryKey: ['dashboard-pinned-post-its'], queryFn: () => listPinnedPostIts() });
  const stockAlertsQuery = useQuery({ queryKey: ['dashboard-stock-alerts'], queryFn: listStockAlerts });
  const expiringStockQuery = useQuery({ queryKey: ['dashboard-expiring-stock'], queryFn: () => listExpiringStock() });
  const cyclesQuery = useQuery({ queryKey: ['dashboard-today-cycles'], queryFn: listTodayCycles });
  const breakdownsQuery = useQuery({ queryKey: ['dashboard-breakdowns'], queryFn: () => listOpenBreakdowns() });
  const materialRequestsQuery = useQuery({ queryKey: ['dashboard-material-requests'], queryFn: () => listPendingMaterialRequests() });

  const nonConformingToday = cyclesQuery.data?.filter((cycle) => cycle.result === 'non_conforming').length ?? 0;
  const stockAlertCount = (stockAlertsQuery.data?.outOfStock.length ?? 0) + (stockAlertsQuery.data?.lowStock.length ?? 0);

  return (
    <ScreenContainer>
      <View>
        <Text style={[styles.greeting, { color: theme.textMuted }]}>Bonjour</Text>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{profile?.first_name}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatTile
          label="Tâches"
          value={String(tasksQuery.data?.length ?? 0)}
          hint="à faire / en retard"
          tone={(tasksQuery.data?.length ?? 0) > 0 ? 'warning' : 'success'}
        />
        <StatTile label="Stock" value={String(stockAlertCount)} hint="alertes" tone={stockAlertCount > 0 ? 'warning' : 'success'} />
        <StatTile
          label="Cycles"
          value={String(cyclesQuery.data?.length ?? 0)}
          hint="aujourd'hui"
          tone={nonConformingToday > 0 ? 'danger' : 'success'}
        />
        <StatTile
          label="Pannes"
          value={String(breakdownsQuery.data?.length ?? 0)}
          hint="en cours"
          tone={(breakdownsQuery.data?.length ?? 0) > 0 ? 'warning' : 'success'}
        />
      </View>

      {nonConformingToday > 0 ? <Badge label={`${nonConformingToday} cycle(s) non conforme(s) aujourd'hui`} tone="danger" /> : null}

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
        emptyLabel="Aucune tâche en attente"
        action={<SectionLink href="/tasks" />}>
        <View style={styles.list}>
          {tasksQuery.data?.map((task) => (
            <TaskListItem key={task.id} task={task} />
          ))}
        </View>
      </DashboardSection>

      <DashboardSection
        title="Demandes de matériel en attente"
        isLoading={materialRequestsQuery.isLoading}
        isEmpty={materialRequestsQuery.data?.length === 0}
        emptyLabel="Aucune demande en attente">
        <View style={styles.list}>
          {materialRequestsQuery.data?.map((request) => (
            <Card key={request.id} style={styles.row}>
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {summarizeRequestItems(request.items)}
              </Text>
              <Badge label={URGENCY_LABEL[request.urgency]} tone={URGENCY_TONE[request.urgency]} />
            </Card>
          ))}
        </View>
      </DashboardSection>

      <DashboardSection
        title="Stock faible / rupture"
        isLoading={stockAlertsQuery.isLoading}
        isEmpty={stockAlertCount === 0}
        emptyLabel="Aucune alerte de stock"
        action={<SectionLink href="/stock" />}>
        <View style={styles.list}>
          {stockAlertsQuery.data?.outOfStock.map((item) => (
            <Card key={item.id} style={styles.row}>
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Badge label="Rupture" tone="danger" />
            </Card>
          ))}
          {stockAlertsQuery.data?.lowStock.map((item) => (
            <Card key={item.id} style={styles.row}>
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.itemHint, { color: theme.textMuted }]}>
                {item.quantity} {item.unit}
              </Text>
              <Badge label="Faible" tone="warning" />
            </Card>
          ))}
        </View>
      </DashboardSection>

      <DashboardSection
        title="Péremptions proches"
        isLoading={expiringStockQuery.isLoading}
        isEmpty={expiringStockQuery.data?.length === 0}
        emptyLabel="Rien n'expire dans les 30 prochains jours"
        action={<SectionLink href="/stock" />}>
        <View style={styles.list}>
          {expiringStockQuery.data?.map((item) => (
            <Card key={item.id} style={styles.row}>
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Badge label={item.expiry_bucket === 'expired' ? 'Expiré' : formatDate(item.expiry_date)} tone={item.expiry_bucket === 'expired' ? 'danger' : 'warning'} />
            </Card>
          ))}
        </View>
      </DashboardSection>

      <DashboardSection
        title="Stérilisation du jour"
        isLoading={cyclesQuery.isLoading}
        isEmpty={cyclesQuery.data?.length === 0}
        emptyLabel="Aucun cycle enregistré aujourd'hui"
        action={<SectionLink href="/sterilization" />}>
        <View style={styles.list}>
          {cyclesQuery.data?.map((cycle) => (
            <Card key={cycle.id} style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {cycle.cycle_number ?? 'Cycle'} · {formatDateTime(cycle.performed_at)}
                </Text>
              </View>
              <Badge label={cycle.result === 'conforming' ? 'Conforme' : 'Non conforme'} tone={cycle.result === 'conforming' ? 'success' : 'danger'} />
            </Card>
          ))}
        </View>
      </DashboardSection>

      <DashboardSection
        title="Pannes en cours"
        isLoading={breakdownsQuery.isLoading}
        isEmpty={breakdownsQuery.data?.length === 0}
        emptyLabel="Aucune panne signalée"
        action={<SectionLink href="/equipment" />}>
        <View style={styles.list}>
          {breakdownsQuery.data?.map((breakdown) => (
            <Card key={breakdown.id} style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {breakdown.equipmentName ?? 'Équipement'}
                </Text>
                <Text style={[styles.itemHint, { color: theme.textMuted }]} numberOfLines={1}>
                  {breakdown.description}
                </Text>
              </View>
              <Badge label={BREAKDOWN_URGENCY_LABEL[breakdown.urgency]} tone={BREAKDOWN_URGENCY_TONE[breakdown.urgency]} />
            </Card>
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
  postItRow: { gap: spacing.md, paddingRight: spacing.lg },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  itemTitle: { fontSize: typography.size.base, fontWeight: typography.weight.medium, flexShrink: 1 },
  itemHint: { fontSize: typography.size.xs },
});
