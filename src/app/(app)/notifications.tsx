import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Badge, Button, Card, EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { NOTIFICATION_TYPE_LABEL, NOTIFICATION_TYPES } from '@/constants/notificationLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDateTime, toISODate } from '@/lib/format';
import { listMyNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/notifications';
import { getNotificationPreferences, setNotificationPreferences } from '@/services/pushNotifications';
import { listExpiringStock } from '@/services/stock';
import { listTodayAndOverdueTasks } from '@/services/tasks';
import { usePermissions } from '@/permissions/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import type { NotificationRow } from '@/types/database';

/** §51 : centre de notifications. Les notifications stockées (`notifications`) couvrent les événements ponctuels
 * (rupture de stock, cycle non conforme, nouvelle demande, commande à réceptionner) via des triggers serveur.
 * Les rappels "X jours avant" du cahier des charges (tâches en retard, péremption, maintenance) sont par nature
 * périodiques — pas de pg_cron configuré sur ce projet — donc affichés ici en direct plutôt que simulés. */
export default function NotificationsScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [showPreferences, setShowPreferences] = useState(false);

  const preferencesQuery = useQuery({
    queryKey: ['notification-preferences', profile?.id],
    queryFn: () => getNotificationPreferences(profile!.id),
    enabled: !!profile && showPreferences,
  });

  const notificationsQuery = useQuery({ queryKey: ['notifications-mine'], queryFn: () => listMyNotifications() });
  const overdueTasksQuery = useQuery({ queryKey: ['dashboard-tasks-today'], queryFn: () => listTodayAndOverdueTasks() });
  const expiringStockQuery = useQuery({
    queryKey: ['dashboard-expiring-stock'],
    queryFn: () => listExpiringStock(50),
    enabled: can(PERMISSIONS.VIEW_STOCK),
  });

  const todayStr = toISODate(new Date());
  const overdueCount = (overdueTasksQuery.data ?? []).filter((t) => t.due_date && t.due_date < todayStr).length;
  const expiringSoonCount = (expiringStockQuery.data ?? []).filter((s) => s.expiry_bucket === 'under_30' || s.expiry_bucket === 'expired').length;

  const unreadCount = (notificationsQuery.data ?? []).filter((n) => !n.read_at).length;

  async function handleMarkRead(notification: NotificationRow) {
    if (notification.read_at) return;
    await markNotificationRead(notification.id);
    queryClient.invalidateQueries({ queryKey: ['notifications-mine'] });
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications-mine'] });
  }

  async function handleToggleUrgentOnly(next: boolean) {
    if (!profile) return;
    await setNotificationPreferences(profile.id, { urgentOnly: next });
    queryClient.invalidateQueries({ queryKey: ['notification-preferences', profile.id] });
  }

  async function handleToggleCategory(type: string, next: boolean) {
    if (!profile) return;
    const current = preferencesQuery.data?.categories_enabled ?? {};
    await setNotificationPreferences(profile.id, { categoriesEnabled: { ...current, [type]: next } });
    queryClient.invalidateQueries({ queryKey: ['notification-preferences', profile.id] });
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Notifications</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowPreferences((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Préférences de notification"
            style={[styles.iconButton, { borderColor: theme.border }]}>
            <Ionicons name="options-outline" size={20} color={theme.textSecondary} />
          </Pressable>
          {unreadCount > 0 ? <Button label="Tout marquer lu" variant="ghost" onPress={handleMarkAllRead} /> : null}
        </View>
      </View>

      {showPreferences ? (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Préférences</Text>
          {preferencesQuery.isLoading ? (
            <LoadingState label="Chargement..." />
          ) : (
            <View style={styles.list}>
              <Pressable
                style={styles.prefRow}
                onPress={() => handleToggleUrgentOnly(!preferencesQuery.data?.urgent_only)}
                accessibilityRole="switch"
                accessibilityState={{ checked: !!preferencesQuery.data?.urgent_only }}>
                <Text style={[styles.itemTitle, styles.flex1, { color: theme.textPrimary }]}>Urgentes uniquement</Text>
                <Ionicons
                  name={preferencesQuery.data?.urgent_only ? 'toggle' : 'toggle-outline'}
                  size={28}
                  color={preferencesQuery.data?.urgent_only ? theme.primary : theme.textMuted}
                />
              </Pressable>
              {NOTIFICATION_TYPES.map((type) => {
                const enabled = preferencesQuery.data?.categories_enabled?.[type] !== false;
                return (
                  <Pressable
                    key={type}
                    style={styles.prefRow}
                    onPress={() => handleToggleCategory(type, !enabled)}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: enabled }}>
                    <Text style={[styles.itemHint, styles.flex1, { color: theme.textSecondary }]}>{NOTIFICATION_TYPE_LABEL[type]}</Text>
                    <Ionicons name={enabled ? 'toggle' : 'toggle-outline'} size={24} color={enabled ? theme.primary : theme.textMuted} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>
      ) : null}

      {overdueCount > 0 || expiringSoonCount > 0 ? (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>À surveiller</Text>
          <View style={styles.list}>
            {overdueCount > 0 ? (
              <View style={styles.row}>
                <Ionicons name="alert-circle" size={18} color={theme.danger} />
                <Text style={[styles.watchLabel, styles.flex1, { color: theme.textPrimary }]}>
                  {overdueCount} tâche{overdueCount > 1 ? 's' : ''} en retard
                </Text>
              </View>
            ) : null}
            {expiringSoonCount > 0 ? (
              <View style={styles.row}>
                <Ionicons name="alert-circle" size={18} color={theme.warning} />
                <Text style={[styles.watchLabel, styles.flex1, { color: theme.textPrimary }]}>
                  {expiringSoonCount} produit{expiringSoonCount > 1 ? 's' : ''} expiré(s) ou bientôt périmé(s)
                </Text>
              </View>
            ) : null}
          </View>
        </Card>
      ) : null}

      {notificationsQuery.isLoading ? (
        <LoadingState />
      ) : notificationsQuery.data?.length === 0 ? (
        <EmptyState title="Aucune notification" />
      ) : (
        <View style={styles.list}>
          {notificationsQuery.data?.map((notification) => (
            <Pressable key={notification.id} onPress={() => handleMarkRead(notification)}>
              <Card style={[styles.row, !notification.read_at ? { borderColor: theme.primary, borderWidth: 1.5 } : null]}>
                {!notification.read_at ? <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} /> : null}
                <View style={styles.flex1}>
                  <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                    {notification.title}
                  </Text>
                  {notification.body ? (
                    <Text style={[styles.itemHint, { color: theme.textSecondary }]} numberOfLines={2}>
                      {notification.body}
                    </Text>
                  ) : null}
                  <Text style={[styles.itemHint, { color: theme.textMuted }]}>{formatDateTime(notification.created_at)}</Text>
                </View>
                {notification.is_urgent ? <Badge label="Urgent" tone="danger" /> : null}
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, marginBottom: spacing.sm },
  list: { gap: spacing.sm },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  watchLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  itemTitle: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  itemHint: { fontSize: typography.size.xs },
});
