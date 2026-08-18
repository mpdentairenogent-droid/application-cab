import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { AbsenceDetailSheet } from '@/components/absences/AbsenceDetailSheet';
import { AbsenceFormSheet } from '@/components/absences/AbsenceFormSheet';
import { Badge, Card, ChipSelect, EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { ABSENCE_STATUS_LABEL, ABSENCE_STATUS_TONE, ABSENCE_TYPE_LABEL } from '@/constants/organizationLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDate } from '@/lib/format';
import { usePermissions } from '@/permissions/usePermissions';
import { listMyAbsences, listTeamAbsences } from '@/services/absences';
import { listActiveTeamMembers } from '@/services/team';
import type { AbsenceRow } from '@/types/database';

type AbsencesView = 'mine' | 'team';

export default function AbsencesScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const { can } = usePermissions();
  const canViewTeam = can(PERMISSIONS.VIEW_TEAM);
  const canManage = can(PERMISSIONS.MANAGE_USERS);
  const queryClient = useQueryClient();

  const [view, setView] = useState<AbsencesView>('mine');
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<AbsenceRow | undefined>(undefined);

  const mineQuery = useQuery({ queryKey: ['absences-mine', profile?.id], queryFn: () => listMyAbsences(profile!.id), enabled: view === 'mine' && !!profile });
  const teamQuery = useQuery({ queryKey: ['absences-team'], queryFn: listTeamAbsences, enabled: view === 'team' && canViewTeam });
  const teamMembersQuery = useQuery({ queryKey: ['team-members-active'], queryFn: listActiveTeamMembers, enabled: view === 'team' && canViewTeam });

  const nameById = useMemo(() => new Map((teamMembersQuery.data ?? []).map((m) => [m.id, `${m.first_name} ${m.last_name}`])), [teamMembersQuery.data]);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['absences-mine'] });
    queryClient.invalidateQueries({ queryKey: ['absences-team'] });
  }

  const viewOptions = [
    { value: 'mine' as const, label: 'Mes absences' },
    ...(canViewTeam ? [{ value: 'team' as const, label: "L'équipe" }] : []),
  ];

  const list = view === 'mine' ? mineQuery.data : teamQuery.data;
  const isLoading = view === 'mine' ? mineQuery.isLoading : teamQuery.isLoading;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Absences</Text>
        <Pressable onPress={() => setFormOpen(true)} accessibilityRole="button" accessibilityLabel="Demander une absence" style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={24} color={theme.textOnPrimary} />
        </Pressable>
      </View>

      {viewOptions.length > 1 ? <ChipSelect label="Vue" options={viewOptions} value={view} onChange={setView} /> : null}

      {isLoading ? (
        <LoadingState />
      ) : list?.length === 0 ? (
        <EmptyState title="Aucune absence" />
      ) : (
        <View style={styles.list}>
          {list?.map((absence) => (
            <Pressable key={absence.id} onPress={() => setSelected(absence)}>
              <Card style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {view === 'team' ? (nameById.get(absence.user_id) ?? 'Membre') : ABSENCE_TYPE_LABEL[absence.absence_type]}
                  </Text>
                  <Text style={[styles.itemHint, { color: theme.textMuted }]}>
                    {view === 'team' ? `${ABSENCE_TYPE_LABEL[absence.absence_type]} · ` : ''}
                    {formatDate(absence.start_date)} → {formatDate(absence.end_date)}
                  </Text>
                </View>
                <Badge label={ABSENCE_STATUS_LABEL[absence.status]} tone={ABSENCE_STATUS_TONE[absence.status]} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      <AbsenceFormSheet
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          invalidateAll();
        }}
      />

      <AbsenceDetailSheet
        visible={!!selected}
        onClose={() => setSelected(undefined)}
        onSaved={() => {
          setSelected(undefined);
          invalidateAll();
        }}
        absence={selected ? { ...selected, userName: nameById.get(selected.user_id) } : undefined}
        canManage={canManage}
        isOwn={selected?.user_id === profile?.id}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  itemTitle: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  itemHint: { fontSize: typography.size.xs },
});
