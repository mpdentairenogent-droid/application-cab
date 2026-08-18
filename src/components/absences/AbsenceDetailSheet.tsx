import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button, ChipSelect, Sheet } from '@/components/ui';
import { ABSENCE_STATUS_LABEL, ABSENCE_STATUS_TONE, ABSENCE_TYPE_LABEL } from '@/constants/organizationLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';
import { deleteAbsence, setAbsenceStatus } from '@/services/absences';
import type { AbsenceRow } from '@/types/database';

interface AbsenceWithName extends AbsenceRow {
  userName?: string;
}

interface AbsenceDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  absence?: AbsenceWithName;
  canManage: boolean;
  isOwn: boolean;
}

export function AbsenceDetailSheet({ visible, onClose, onSaved, absence, canManage, isOwn }: AbsenceDetailSheetProps) {
  const theme = useAppTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!absence) return null;

  async function handleStatusChange(status: AbsenceRow['status']) {
    if (!absence) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await setAbsenceStatus(absence.id, status);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!absence) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteAbsence(absence.id);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  const canCancel = isOwn && absence.status === 'requested';

  return (
    <Sheet visible={visible} onClose={onClose} title={absence.userName ?? ABSENCE_TYPE_LABEL[absence.absence_type]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Type</Text>
        <Text style={[styles.value, { color: theme.textPrimary }]}>{ABSENCE_TYPE_LABEL[absence.absence_type]}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Période</Text>
        <Text style={[styles.value, { color: theme.textPrimary }]}>
          {formatDate(absence.start_date)} → {formatDate(absence.end_date)}
        </Text>
      </View>
      {absence.comment ? (
        <View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Commentaire</Text>
          <Text style={[styles.value, { color: theme.textPrimary, textAlign: 'left' }]}>{absence.comment}</Text>
        </View>
      ) : null}

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

      {canManage ? (
        <ChipSelect
          label="Statut"
          options={[
            { value: 'requested' as const, label: 'Demandée' },
            { value: 'approved' as const, label: 'Approuvée' },
            { value: 'rejected' as const, label: 'Refusée' },
          ]}
          value={absence.status}
          onChange={(value) => handleStatusChange(value)}
        />
      ) : (
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Statut</Text>
          <Badge label={ABSENCE_STATUS_LABEL[absence.status]} tone={ABSENCE_STATUS_TONE[absence.status]} />
        </View>
      )}

      {canCancel ? <Button label="Annuler la demande" variant="ghost" onPress={handleCancel} loading={isSubmitting} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  value: { fontSize: typography.size.base, fontWeight: typography.weight.medium, flexShrink: 1, textAlign: 'right' },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
});
