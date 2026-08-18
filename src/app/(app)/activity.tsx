import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Card, EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { listRecentAuditLogs } from '@/services/auditLogs';
import { listMyRevenueHistory } from '@/services/revenue';

const AUDIT_ACTION_LABEL: Record<string, string> = {
  create: 'a créé',
  update: 'a modifié',
  delete: 'a supprimé',
};

function MyActivityHistory({ practitionerId }: { practitionerId: string }) {
  const theme = useAppTheme();
  const historyQuery = useQuery({ queryKey: ['my-revenue-history', practitionerId], queryFn: () => listMyRevenueHistory(practitionerId) });

  if (historyQuery.isLoading) return <LoadingState label="Chargement de l'historique..." />;
  if (!historyQuery.data || historyQuery.data.length === 0) {
    return <EmptyState title="Aucune activité enregistrée" description="Ton chiffre d'affaires apparaîtra ici au fur et à mesure." />;
  }

  return (
    <View style={styles.list}>
      {historyQuery.data.map((entry) => (
        <Card key={entry.id} style={styles.row}>
          <View style={styles.flex1}>
            <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{formatDate(entry.entry_date)}</Text>
            {entry.patient_count ? <Text style={[styles.itemHint, { color: theme.textMuted }]}>{entry.patient_count} patient(s)</Text> : null}
          </View>
          <Text style={[styles.amount, { color: theme.textPrimary }]}>{formatCurrency(Number(entry.amount))}</Text>
        </Card>
      ))}
    </View>
  );
}

function TeamActivityFeed() {
  const theme = useAppTheme();
  const logsQuery = useQuery({ queryKey: ['recent-audit-logs'], queryFn: () => listRecentAuditLogs() });

  if (logsQuery.isLoading) return <LoadingState label="Chargement de l'activité..." />;
  if (!logsQuery.data || logsQuery.data.length === 0) {
    return <EmptyState title="Aucune activité récente" />;
  }

  return (
    <View style={styles.list}>
      {logsQuery.data.map((log) => (
        <Card key={log.id} style={styles.row}>
          <View style={styles.flex1}>
            <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>
              {log.actorName ?? 'Quelqu’un'} {AUDIT_ACTION_LABEL[log.action] ?? log.action} {log.entity_type}
            </Text>
            <Text style={[styles.itemHint, { color: theme.textMuted }]}>{formatDateTime(log.created_at)}</Text>
          </View>
        </Card>
      ))}
    </View>
  );
}

export default function ActivityScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  if (!profile) return null;

  const isCollaborator = profile.role === 'collaborator_dentist';

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{isCollaborator ? 'Mon activité' : 'Activité du cabinet'}</Text>
      {isCollaborator && profile.practitioner_id ? <MyActivityHistory practitionerId={profile.practitioner_id} /> : <TeamActivityFeed />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  itemTitle: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  itemHint: { fontSize: typography.size.xs },
  amount: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
});
