import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ControlFormSheet } from '@/components/sterilization/ControlFormSheet';
import { CycleFormSheet, type CyclePrefill } from '@/components/sterilization/CycleFormSheet';
import { IncidentDetailSheet } from '@/components/sterilization/IncidentDetailSheet';
import { IncidentFormSheet } from '@/components/sterilization/IncidentFormSheet';
import { ScanCycleLabelSheet } from '@/components/sterilization/ScanCycleLabelSheet';
import { Badge, Card, ChipSelect, EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import {
  CONTROL_RESULT_LABEL,
  CONTROL_RESULT_TONE,
  CONTROL_TYPE_LABEL,
  CYCLE_RESULT_LABEL,
  CYCLE_RESULT_TONE,
  INCIDENT_STATUS_LABEL,
  INCIDENT_STATUS_TONE,
} from '@/constants/sterilizationLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDate, formatDateTime } from '@/lib/format';
import { usePermissions } from '@/permissions/usePermissions';
import { listControls, listCycles, listIncidents } from '@/services/sterilization';
import type { SterilizationCycleRow, SterilizationIncidentRow } from '@/types/database';

type SterilizationView = 'cycles' | 'controls' | 'incidents';

const VIEW_OPTIONS = [
  { value: 'cycles' as const, label: 'Cycles' },
  { value: 'controls' as const, label: 'Contrôles' },
  { value: 'incidents' as const, label: 'Incidents' },
];

export default function SterilizationScreen() {
  const theme = useAppTheme();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.MANAGE_STERILIZATION);
  const [view, setView] = useState<SterilizationView>('cycles');
  const queryClient = useQueryClient();

  const [cycleFormOpen, setCycleFormOpen] = useState(false);
  const [controlFormOpen, setControlFormOpen] = useState(false);
  const [nonConformingCycle, setNonConformingCycle] = useState<SterilizationCycleRow | undefined>(undefined);
  const [selectedIncident, setSelectedIncident] = useState<SterilizationIncidentRow | undefined>(undefined);
  const [scanCycleSheetOpen, setScanCycleSheetOpen] = useState(false);
  const [cyclePrefill, setCyclePrefill] = useState<CyclePrefill | undefined>(undefined);

  function handleCycleLabelExtracted(draft: { cycleNumber: string | null; program: string | null; batchNumber: string | null; result: 'conforming' | 'non_conforming' | null; comment: string | null }, photoUri: string) {
    setScanCycleSheetOpen(false);
    setCyclePrefill({ ...draft, photoUrl: photoUri });
    setCycleFormOpen(true);
  }

  // Reprend l'appareil et le programme (ce qui ne change quasi jamais d'un
  // cycle à l'autre) ; laisse numéro de cycle/lot et résultat à ressaisir —
  // ce sont eux qui varient réellement à chaque cycle.
  function handleDuplicateCycle(cycle: SterilizationCycleRow) {
    setCyclePrefill({ equipmentId: cycle.equipment_id, program: cycle.program, cycleNumber: null, batchNumber: null, result: 'conforming', comment: null });
    setCycleFormOpen(true);
  }

  const cyclesQuery = useQuery({ queryKey: ['sterilization-cycles-all'], queryFn: () => listCycles(), enabled: view === 'cycles' });
  const controlsQuery = useQuery({ queryKey: ['sterilization-controls-all'], queryFn: () => listControls(), enabled: view === 'controls' });
  const incidentsQuery = useQuery({ queryKey: ['sterilization-incidents-all'], queryFn: () => listIncidents(), enabled: view === 'incidents' });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['sterilization-cycles-all'] });
    queryClient.invalidateQueries({ queryKey: ['sterilization-controls-all'] });
    queryClient.invalidateQueries({ queryKey: ['sterilization-incidents-all'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-today-cycles'] });
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Stérilisation</Text>
        {canManage && view === 'cycles' ? (
          <View style={styles.headerActions}>
            <Pressable onPress={() => setScanCycleSheetOpen(true)} accessibilityRole="button" accessibilityLabel="Scanner une étiquette" style={[styles.addButton, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name="camera-outline" size={22} color={theme.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => {
                setCyclePrefill(undefined);
                setCycleFormOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Nouveau cycle"
              style={[styles.addButton, { backgroundColor: theme.primary }]}>
              <Ionicons name="add" size={24} color={theme.textOnPrimary} />
            </Pressable>
          </View>
        ) : null}
        {canManage && view === 'controls' ? (
          <Pressable onPress={() => setControlFormOpen(true)} accessibilityRole="button" accessibilityLabel="Nouveau contrôle" style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={24} color={theme.textOnPrimary} />
          </Pressable>
        ) : null}
      </View>

      <ChipSelect label="Vue" options={VIEW_OPTIONS} value={view} onChange={setView} />

      {view === 'cycles' ? (
        cyclesQuery.isLoading ? (
          <LoadingState />
        ) : cyclesQuery.data?.length === 0 ? (
          <EmptyState title="Aucun cycle enregistré" />
        ) : (
          <View style={styles.list}>
            {cyclesQuery.data?.map((cycle) => (
              <Card key={cycle.id} style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {cycle.cycle_number ? `Cycle ${cycle.cycle_number}` : 'Cycle'}
                    {cycle.batch_number ? ` · Lot ${cycle.batch_number}` : ''}
                  </Text>
                  <Text style={[styles.itemHint, { color: theme.textMuted }]}>{formatDateTime(cycle.performed_at)}</Text>
                </View>
                <Badge label={CYCLE_RESULT_LABEL[cycle.result]} tone={CYCLE_RESULT_TONE[cycle.result]} />
                {canManage ? (
                  <Pressable
                    onPress={() => handleDuplicateCycle(cycle)}
                    accessibilityRole="button"
                    accessibilityLabel="Dupliquer ce cycle"
                    hitSlop={8}
                    style={styles.duplicateButton}>
                    <Ionicons name="copy-outline" size={20} color={theme.textSecondary} />
                  </Pressable>
                ) : null}
              </Card>
            ))}
          </View>
        )
      ) : null}

      {view === 'controls' ? (
        controlsQuery.isLoading ? (
          <LoadingState />
        ) : controlsQuery.data?.length === 0 ? (
          <EmptyState title="Aucun contrôle enregistré" />
        ) : (
          <View style={styles.list}>
            {controlsQuery.data?.map((ctrl) => (
              <Card key={ctrl.id} style={styles.row}>
                {ctrl.photo_url ? <Image source={{ uri: ctrl.photo_url }} style={styles.thumbnail} /> : null}
                <View style={styles.flex1}>
                  <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {CONTROL_TYPE_LABEL[ctrl.control_type]}
                  </Text>
                  <Text style={[styles.itemHint, { color: theme.textMuted }]}>
                    {formatDate(ctrl.performed_at)}
                    {ctrl.next_due_date ? ` · Prochaine échéance ${formatDate(ctrl.next_due_date)}` : ''}
                  </Text>
                </View>
                {ctrl.result ? <Badge label={CONTROL_RESULT_LABEL[ctrl.result]} tone={CONTROL_RESULT_TONE[ctrl.result]} /> : null}
              </Card>
            ))}
          </View>
        )
      ) : null}

      {view === 'incidents' ? (
        incidentsQuery.isLoading ? (
          <LoadingState />
        ) : incidentsQuery.data?.length === 0 ? (
          <EmptyState title="Aucun incident" />
        ) : (
          <View style={styles.list}>
            {incidentsQuery.data?.map((incident) => (
              <Pressable key={incident.id} onPress={() => setSelectedIncident(incident)}>
                <Card style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                      {incident.description}
                    </Text>
                    <Text style={[styles.itemHint, { color: theme.textMuted }]}>{formatDateTime(incident.created_at)}</Text>
                  </View>
                  <Badge label={INCIDENT_STATUS_LABEL[incident.status]} tone={INCIDENT_STATUS_TONE[incident.status]} />
                </Card>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      <CycleFormSheet
        visible={cycleFormOpen}
        onClose={() => {
          setCycleFormOpen(false);
          setCyclePrefill(undefined);
        }}
        onSaved={(cycle) => {
          setCycleFormOpen(false);
          setCyclePrefill(undefined);
          invalidateAll();
          if (cycle.result === 'non_conforming') setNonConformingCycle(cycle);
        }}
        prefill={cyclePrefill}
      />

      <ScanCycleLabelSheet visible={scanCycleSheetOpen} onClose={() => setScanCycleSheetOpen(false)} onExtracted={handleCycleLabelExtracted} />

      <IncidentFormSheet
        visible={!!nonConformingCycle}
        onClose={() => setNonConformingCycle(undefined)}
        cycleId={nonConformingCycle?.id}
        onSaved={() => {
          setNonConformingCycle(undefined);
          invalidateAll();
        }}
      />

      <IncidentDetailSheet
        visible={!!selectedIncident}
        onClose={() => setSelectedIncident(undefined)}
        incident={selectedIncident}
        onSaved={() => {
          setSelectedIncident(undefined);
          invalidateAll();
        }}
      />

      <ControlFormSheet
        visible={controlFormOpen}
        onClose={() => setControlFormOpen(false)}
        onSaved={() => {
          setControlFormOpen(false);
          invalidateAll();
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  duplicateButton: { padding: spacing.xs },
  thumbnail: { width: 40, height: 40, borderRadius: 8 },
  flex1: { flex: 1 },
  itemTitle: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  itemHint: { fontSize: typography.size.xs },
});
