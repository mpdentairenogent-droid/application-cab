import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Badge, Card, EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { MessageFormSheet } from '@/components/messages/MessageFormSheet';
import { ROLE_LABELS } from '@/constants/permissions';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDateTime } from '@/lib/format';
import { acknowledgeMessage, listInternalMessages } from '@/services/internalMessages';

const CAN_AUTHOR_ROLES = new Set(['owner_dentist', 'admin_staff', 'super_admin']);

export default function MessagesScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['internal-messages', profile?.id],
    queryFn: () => listInternalMessages(profile!.id),
    enabled: !!profile,
  });

  const canAuthor = profile ? CAN_AUTHOR_ROLES.has(profile.role) : false;

  async function handleAcknowledge(messageId: string) {
    if (!profile) return;
    await acknowledgeMessage(messageId, profile.id);
    queryClient.invalidateQueries({ queryKey: ['internal-messages'] });
  }

  function handleSaved() {
    setFormOpen(false);
    queryClient.invalidateQueries({ queryKey: ['internal-messages'] });
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Messages</Text>
        {canAuthor ? (
          <Pressable onPress={() => setFormOpen(true)} accessibilityRole="button" accessibilityLabel="Nouvelle annonce" style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={24} color={theme.textOnPrimary} />
          </Pressable>
        ) : null}
      </View>

      {messagesQuery.isLoading ? (
        <LoadingState />
      ) : messagesQuery.data?.length === 0 ? (
        <EmptyState title="Aucune annonce" description="Les annonces du cabinet apparaîtront ici." />
      ) : (
        <View style={styles.list}>
          {messagesQuery.data?.map((message) => (
            <Card key={message.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={[styles.messageTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {message.title}
                </Text>
                {message.audience_type === 'role' && message.audience_role ? (
                  <Badge label={ROLE_LABELS[message.audience_role]} tone="info" />
                ) : (
                  <Badge label="Équipe" tone="neutral" />
                )}
              </View>
              <Text style={[styles.body, { color: theme.textSecondary }]}>{message.body}</Text>
              <Text style={[styles.meta, { color: theme.textMuted }]}>
                {message.authorName ?? 'Quelqu\'un'} · {formatDateTime(message.created_at)}
              </Text>
              {message.requires_acknowledgement ? (
                message.acknowledgedByMe ? (
                  <Badge label="Lecture confirmée" tone="success" />
                ) : (
                  <Pressable onPress={() => handleAcknowledge(message.id)} style={[styles.ackButton, { borderColor: theme.primary }]}>
                    <Text style={[styles.ackButtonLabel, { color: theme.primary }]}>Confirmer la lecture</Text>
                  </Pressable>
                )
              ) : null}
            </Card>
          ))}
        </View>
      )}

      <MessageFormSheet visible={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.md },
  card: { gap: spacing.xs },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  messageTitle: { flex: 1, fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  body: { fontSize: typography.size.sm },
  meta: { fontSize: typography.size.xs },
  ackButton: { alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginTop: spacing.xs },
  ackButtonLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
});
