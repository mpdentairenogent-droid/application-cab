import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InviteTeamMemberSheet } from '@/components/team/InviteTeamMemberSheet';
import { TeamMemberDetailSheet } from '@/components/team/TeamMemberDetailSheet';
import { Avatar, Badge, Card, EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { ROLE_LABELS } from '@/constants/permissions';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { listAllTeamMembers } from '@/services/team';
import type { ProfileRow } from '@/types/database';

export default function TeamScreen() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<ProfileRow | undefined>(undefined);
  const [isInviteVisible, setIsInviteVisible] = useState(false);

  const membersQuery = useQuery({ queryKey: ['team-members-all'], queryFn: listAllTeamMembers });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['team-members-all'] });
    queryClient.invalidateQueries({ queryKey: ['team-members'] });
    queryClient.invalidateQueries({ queryKey: ['team-members-active'] });
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Équipe</Text>
        <Pressable
          onPress={() => setIsInviteVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Inviter un membre"
          style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={24} color={theme.textOnPrimary} />
        </Pressable>
      </View>

      {membersQuery.isLoading ? (
        <LoadingState />
      ) : membersQuery.data?.length === 0 ? (
        <EmptyState title="Aucun membre" />
      ) : (
        <View style={styles.list}>
          {membersQuery.data?.map((member) => (
            <Pressable key={member.id} onPress={() => setSelectedMember(member)}>
              <Card style={styles.row}>
                <Avatar firstName={member.first_name} lastName={member.last_name} imageUrl={member.avatar_url} size={44} />
                <View style={styles.flex1}>
                  <Text style={[styles.itemTitle, { color: member.status === 'active' ? theme.textPrimary : theme.textMuted }]} numberOfLines={1}>
                    {member.first_name} {member.last_name}
                  </Text>
                  <Text style={[styles.itemHint, { color: theme.textMuted }]}>{ROLE_LABELS[member.role]}</Text>
                </View>
                {member.status === 'inactive' ? <Badge label="Désactivé" tone="neutral" /> : null}
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      <TeamMemberDetailSheet
        visible={!!selectedMember}
        onClose={() => setSelectedMember(undefined)}
        onSaved={() => {
          setSelectedMember(undefined);
          invalidateAll();
        }}
        member={selectedMember}
      />

      <InviteTeamMemberSheet
        visible={isInviteVisible}
        onClose={() => setIsInviteVisible(false)}
        onCreated={() => {
          setIsInviteVisible(false);
          invalidateAll();
        }}
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
