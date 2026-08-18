import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { CalendarEventFormSheet } from '@/components/calendar/CalendarEventFormSheet';
import { Badge, Card, ChipSelect, EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { EVENT_TYPE_LABEL, EVENT_TYPE_TONE } from '@/constants/organizationLabels';
import { PERMISSIONS } from '@/constants/permissions';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDate, formatRelativeDay } from '@/lib/format';
import { usePermissions } from '@/permissions/usePermissions';
import { listEquipmentMaintenanceDue, listPastEvents, listUpcomingEvents } from '@/services/calendar';
import type { InternalEventRow } from '@/types/database';

type CalendarView = 'upcoming' | 'past';

export default function CalendarScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const { can } = usePermissions();
  const canManageAll = can(PERMISSIONS.MANAGE_USERS);
  const queryClient = useQueryClient();

  const [view, setView] = useState<CalendarView>('upcoming');
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<InternalEventRow | undefined>(undefined);

  const upcomingQuery = useQuery({ queryKey: ['events-upcoming'], queryFn: () => listUpcomingEvents(), enabled: view === 'upcoming' });
  const pastQuery = useQuery({ queryKey: ['events-past'], queryFn: () => listPastEvents(), enabled: view === 'past' });
  const maintenanceDueQuery = useQuery({ queryKey: ['equipment-maintenance-due'], queryFn: () => listEquipmentMaintenanceDue(30), enabled: view === 'upcoming' });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['events-upcoming'] });
    queryClient.invalidateQueries({ queryKey: ['events-past'] });
  }

  function canEdit(event: InternalEventRow) {
    return canManageAll || event.created_by === profile?.id;
  }

  const events = view === 'upcoming' ? upcomingQuery.data : pastQuery.data;
  const isLoading = view === 'upcoming' ? upcomingQuery.isLoading : pastQuery.isLoading;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Calendrier</Text>
        <Pressable
          onPress={() => {
            setEditingEvent(undefined);
            setFormOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Nouvel événement"
          style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={24} color={theme.textOnPrimary} />
        </Pressable>
      </View>

      <ChipSelect
        label="Vue"
        options={[
          { value: 'upcoming' as const, label: 'À venir' },
          { value: 'past' as const, label: 'Passés' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'upcoming' && maintenanceDueQuery.data && maintenanceDueQuery.data.length > 0 ? (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Maintenance à échéance (30 jours)</Text>
          <View style={styles.list}>
            {maintenanceDueQuery.data.map((eq) => (
              <View key={eq.id} style={styles.row}>
                <Text style={[styles.itemTitle, styles.flex1, { color: theme.textPrimary }]} numberOfLines={1}>
                  {eq.name}
                </Text>
                <Badge label={formatDate(eq.next_maintenance_date!)} tone="warning" />
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {isLoading ? (
        <LoadingState />
      ) : events?.length === 0 ? (
        <EmptyState title={view === 'upcoming' ? 'Aucun événement à venir' : 'Aucun événement passé'} />
      ) : (
        <View style={styles.list}>
          {events?.map((event) => (
            <Pressable
              key={event.id}
              onPress={() => {
                if (!canEdit(event)) return;
                setEditingEvent(event);
                setFormOpen(true);
              }}>
              <Card style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={[styles.itemHint, { color: theme.textMuted }]}>
                    {formatRelativeDay(event.starts_at)}
                    {event.ends_at ? ` → ${formatDate(event.ends_at)}` : ''}
                  </Text>
                </View>
                <Badge label={EVENT_TYPE_LABEL[event.event_type]} tone={EVENT_TYPE_TONE[event.event_type]} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      <CalendarEventFormSheet
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          invalidateAll();
        }}
        event={editingEvent}
        canDelete={editingEvent ? canEdit(editingEvent) : true}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, marginBottom: spacing.sm },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  itemTitle: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  itemHint: { fontSize: typography.size.xs },
});
