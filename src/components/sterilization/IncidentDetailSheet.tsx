import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Sheet, TextField } from '@/components/ui';
import { INCIDENT_STATUS_LABEL, INCIDENT_STATUS_TONE } from '@/constants/sterilizationLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDateTime } from '@/lib/format';
import { usePermissions } from '@/permissions/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import { resolveIncident } from '@/services/sterilization';
import type { SterilizationIncidentRow } from '@/types/database';

interface IncidentDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  incident?: SterilizationIncidentRow;
}

export function IncidentDetailSheet({ visible, onClose, onSaved, incident }: IncidentDetailSheetProps) {
  const theme = useAppTheme();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.MANAGE_STERILIZATION);
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!incident) return null;

  async function handleResolve() {
    if (!incident || !correctiveAction.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await resolveIncident(incident.id, correctiveAction.trim());
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Incident de stérilisation">
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Statut</Text>
        <Badge label={INCIDENT_STATUS_LABEL[incident.status]} tone={INCIDENT_STATUS_TONE[incident.status]} />
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Signalé le</Text>
        <Text style={[styles.value, { color: theme.textPrimary }]}>{formatDateTime(incident.created_at)}</Text>
      </View>
      <Text style={[styles.description, { color: theme.textPrimary }]}>{incident.description}</Text>

      {incident.corrective_action ? (
        <View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Action corrective</Text>
          <Text style={[styles.description, { color: theme.textPrimary }]}>{incident.corrective_action}</Text>
        </View>
      ) : null}

      {incident.status === 'open' && canManage ? (
        <>
          <TextField label="Action corrective" required multiline value={correctiveAction} onChangeText={setCorrectiveAction} placeholder="Décrire l'action menée..." />
          {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
          <Button label="Marquer comme résolu" onPress={handleResolve} loading={isSubmitting} disabled={!correctiveAction.trim()} fullWidth />
        </>
      ) : null}
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
