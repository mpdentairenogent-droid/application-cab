import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, ChipSelect, Sheet } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { BREAKDOWN_STATUS_OPTIONS, URGENCY_LABEL, URGENCY_TONE } from '@/constants/equipmentLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDateTime } from '@/lib/format';
import { usePermissions } from '@/permissions/usePermissions';
import { updateBreakdownStatus } from '@/services/equipment';
import type { BreakdownRow } from '@/types/database';

interface BreakdownWithEquipmentName extends BreakdownRow {
  equipmentName: string | null;
}

interface BreakdownDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  breakdown?: BreakdownWithEquipmentName;
}

export function BreakdownDetailSheet({ visible, onClose, onSaved, breakdown }: BreakdownDetailSheetProps) {
  const theme = useAppTheme();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.MANAGE_EQUIPMENT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!breakdown) return null;

  async function handleStatusChange(status: BreakdownRow['status']) {
    if (!breakdown) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateBreakdownStatus(breakdown.id, { status });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={breakdown.equipmentName ?? 'Panne'}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Signalée le</Text>
        <Text style={[styles.value, { color: theme.textPrimary }]}>{formatDateTime(breakdown.created_at)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Urgence</Text>
        <Badge label={URGENCY_LABEL[breakdown.urgency]} tone={URGENCY_TONE[breakdown.urgency]} />
      </View>
      <Text style={[styles.description, { color: theme.textPrimary }]}>{breakdown.description}</Text>

      {isSubmitting ? null : error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

      {canManage ? (
        <ChipSelect label="Statut" options={BREAKDOWN_STATUS_OPTIONS} value={breakdown.status} onChange={(value) => handleStatusChange(value)} />
      ) : (
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Statut</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>{breakdown.status}</Text>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  value: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  description: { fontSize: typography.size.base, marginTop: spacing.xs },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
});
