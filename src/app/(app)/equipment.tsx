import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BreakdownDetailSheet } from '@/components/equipment/BreakdownDetailSheet';
import { BreakdownFormSheet } from '@/components/equipment/BreakdownFormSheet';
import { EquipmentDetailSheet } from '@/components/equipment/EquipmentDetailSheet';
import { EquipmentFormSheet } from '@/components/equipment/EquipmentFormSheet';
import { MaintenanceRecordFormSheet } from '@/components/equipment/MaintenanceRecordFormSheet';
import { Badge, Card, ChipSelect, EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { BREAKDOWN_STATUS_LABEL, BREAKDOWN_STATUS_TONE, EQUIPMENT_STATUS_LABEL, EQUIPMENT_STATUS_TONE, URGENCY_LABEL, URGENCY_TONE } from '@/constants/equipmentLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDate } from '@/lib/format';
import { usePermissions } from '@/permissions/usePermissions';
import { listAllBreakdowns, listAllEquipment } from '@/services/equipment';
import type { BreakdownRow, EquipmentRow } from '@/types/database';

type EquipmentView = 'equipment' | 'breakdowns';
type BreakdownWithEquipmentName = BreakdownRow & { equipmentName: string | null };

const VIEW_OPTIONS = [
  { value: 'equipment' as const, label: 'Équipements' },
  { value: 'breakdowns' as const, label: 'Pannes' },
];

export default function EquipmentScreen() {
  const theme = useAppTheme();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.MANAGE_EQUIPMENT);
  const [view, setView] = useState<EquipmentView>('equipment');
  const queryClient = useQueryClient();

  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentRow | undefined>(undefined);
  const [detailEquipment, setDetailEquipment] = useState<EquipmentRow | undefined>(undefined);
  const [breakdownFormEquipment, setBreakdownFormEquipment] = useState<EquipmentRow | 'generic' | undefined>(undefined);
  const [maintenanceEquipment, setMaintenanceEquipment] = useState<EquipmentRow | undefined>(undefined);
  const [selectedBreakdown, setSelectedBreakdown] = useState<BreakdownWithEquipmentName | undefined>(undefined);

  const equipmentQuery = useQuery({ queryKey: ['equipment-all'], queryFn: listAllEquipment, enabled: view === 'equipment' });
  const breakdownsQuery = useQuery({ queryKey: ['breakdowns-all'], queryFn: () => listAllBreakdowns(), enabled: view === 'breakdowns' });

  // Arrivée depuis le scan d'un QR équipement (voir scan-qr.tsx) : ouvre directement la fiche correspondante.
  const { openId } = useLocalSearchParams<{ openId?: string }>();
  useEffect(() => {
    if (!openId || !equipmentQuery.data) return;
    const match = equipmentQuery.data.find((item) => item.id === openId);
    if (match) setDetailEquipment(match);
  }, [openId, equipmentQuery.data]);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['equipment-all'] });
    queryClient.invalidateQueries({ queryKey: ['breakdowns-all'] });
    queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-breakdowns'] });
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Équipements</Text>
        {view === 'equipment' ? (
          <View style={styles.headerActions}>
            <Link href="/scan-qr" asChild>
              {/* style à plat (pas un tableau) : un tableau de styles traversant <Link asChild> plante
                  react-native-web ("Failed to set an indexed property on CSSStyleDeclaration"). */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Scanner un QR code"
                style={StyleSheet.flatten([styles.addButton, styles.secondaryButton, { borderColor: theme.border }])}>
                <Ionicons name="qr-code-outline" size={20} color={theme.textSecondary} />
              </Pressable>
            </Link>
            {canManage ? (
              <Pressable
                onPress={() => {
                  setEditingEquipment(undefined);
                  setEquipmentFormOpen(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Nouvel équipement"
                style={[styles.addButton, { backgroundColor: theme.primary }]}>
                <Ionicons name="add" size={24} color={theme.textOnPrimary} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {view === 'breakdowns' ? (
          <Pressable
            onPress={() => setBreakdownFormEquipment('generic')}
            accessibilityRole="button"
            accessibilityLabel="Signaler une panne"
            style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={24} color={theme.textOnPrimary} />
          </Pressable>
        ) : null}
      </View>

      <ChipSelect label="Vue" options={VIEW_OPTIONS} value={view} onChange={setView} />

      {view === 'equipment' ? (
        equipmentQuery.isLoading ? (
          <LoadingState />
        ) : equipmentQuery.data?.length === 0 ? (
          <EmptyState title="Aucun équipement" />
        ) : (
          <View style={styles.list}>
            {equipmentQuery.data?.map((item) => (
              <Pressable key={item.id} onPress={() => setDetailEquipment(item)}>
                <Card style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.category ? (
                      <Text style={[styles.itemHint, { color: theme.textMuted }]} numberOfLines={1}>
                        {item.category}
                      </Text>
                    ) : null}
                  </View>
                  <Badge label={EQUIPMENT_STATUS_LABEL[item.status]} tone={EQUIPMENT_STATUS_TONE[item.status]} />
                </Card>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      {view === 'breakdowns' ? (
        breakdownsQuery.isLoading ? (
          <LoadingState />
        ) : breakdownsQuery.data?.length === 0 ? (
          <EmptyState title="Aucune panne signalée" />
        ) : (
          <View style={styles.list}>
            {breakdownsQuery.data?.map((breakdown) => (
              <Pressable key={breakdown.id} onPress={() => setSelectedBreakdown(breakdown)}>
                <Card style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {breakdown.equipmentName ?? 'Équipement non précisé'}
                    </Text>
                    <Text style={[styles.itemHint, { color: theme.textMuted }]} numberOfLines={1}>
                      {breakdown.description}
                    </Text>
                    <Text style={[styles.itemHint, { color: theme.textMuted }]}>{formatDate(breakdown.created_at)}</Text>
                  </View>
                  <Badge label={URGENCY_LABEL[breakdown.urgency]} tone={URGENCY_TONE[breakdown.urgency]} />
                  <Badge label={BREAKDOWN_STATUS_LABEL[breakdown.status]} tone={BREAKDOWN_STATUS_TONE[breakdown.status]} />
                </Card>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      <EquipmentFormSheet
        visible={equipmentFormOpen}
        onClose={() => setEquipmentFormOpen(false)}
        onSaved={() => {
          setEquipmentFormOpen(false);
          setDetailEquipment(undefined);
          invalidateAll();
        }}
        equipment={editingEquipment}
      />

      <EquipmentDetailSheet
        visible={!!detailEquipment}
        onClose={() => setDetailEquipment(undefined)}
        equipment={detailEquipment}
        onEdit={() => {
          // Ferme la fiche avant d'ouvrir le formulaire : deux Sheets (Modal RN Web)
          // visibles en même temps cassent la saisie dans la seconde (portails empilés).
          setEditingEquipment(detailEquipment);
          setDetailEquipment(undefined);
          setEquipmentFormOpen(true);
        }}
        onReportBreakdown={() => {
          setBreakdownFormEquipment(detailEquipment);
          setDetailEquipment(undefined);
        }}
        onAddMaintenance={() => {
          setMaintenanceEquipment(detailEquipment);
          setDetailEquipment(undefined);
        }}
        onDeleted={() => {
          setDetailEquipment(undefined);
          invalidateAll();
        }}
      />

      <BreakdownFormSheet
        visible={!!breakdownFormEquipment}
        onClose={() => setBreakdownFormEquipment(undefined)}
        onSaved={() => {
          setBreakdownFormEquipment(undefined);
          invalidateAll();
        }}
        equipment={breakdownFormEquipment === 'generic' ? undefined : breakdownFormEquipment}
      />

      <MaintenanceRecordFormSheet
        visible={!!maintenanceEquipment}
        onClose={() => setMaintenanceEquipment(undefined)}
        onSaved={() => {
          setMaintenanceEquipment(undefined);
          invalidateAll();
        }}
        equipment={maintenanceEquipment}
      />

      <BreakdownDetailSheet
        visible={!!selectedBreakdown}
        onClose={() => setSelectedBreakdown(undefined)}
        onSaved={() => {
          setSelectedBreakdown(undefined);
          invalidateAll();
        }}
        breakdown={selectedBreakdown}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { borderWidth: 1.5 },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  itemTitle: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  itemHint: { fontSize: typography.size.xs },
});
