import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button, ChipSelect, Divider, Sheet } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { MATERIAL_REQUEST_STATUS_OPTIONS, URGENCY_LABEL, URGENCY_TONE } from '@/constants/stockLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { usePermissions } from '@/permissions/usePermissions';
import { deleteMaterialRequest, setMaterialRequestStatus, type MaterialRequestWithItems } from '@/services/materialRequests';
import type { MaterialRequestRow } from '@/types/database';

interface MaterialRequestDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  request?: MaterialRequestWithItems;
}

export function MaterialRequestDetailSheet({ visible, onClose, onSaved, request }: MaterialRequestDetailSheetProps) {
  const theme = useAppTheme();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.MANAGE_ORDERS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!request) return null;

  async function handleStatusChange(status: MaterialRequestRow['status']) {
    if (!request) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await setMaterialRequestStatus(request.id, status);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!request) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteMaterialRequest(request.id);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  const title = request.items.length === 1 ? request.items[0].product_name : `${request.items.length} articles`;

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.itemsList}>
        {request.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={[styles.itemName, { color: theme.textPrimary }]}>{item.product_name}</Text>
            <Text style={[styles.itemQuantity, { color: theme.textSecondary }]}>× {item.quantity}</Text>
          </View>
        ))}
      </View>

      <Divider />

      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Urgence</Text>
        <Badge label={URGENCY_LABEL[request.urgency]} tone={URGENCY_TONE[request.urgency]} />
      </View>
      {request.comment ? (
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Commentaire</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>{request.comment}</Text>
        </View>
      ) : null}

      {canManage ? (
        <ChipSelect label="Statut" options={MATERIAL_REQUEST_STATUS_OPTIONS} value={request.status} onChange={(value) => handleStatusChange(value)} />
      ) : (
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Statut</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>{request.status}</Text>
        </View>
      )}

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

      {canManage || request.status === 'pending_approval' ? (
        <Button label="Supprimer la demande" variant="ghost" onPress={handleDelete} loading={isSubmitting} />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  itemsList: { gap: spacing.xs },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  itemName: { fontSize: typography.size.base, fontWeight: typography.weight.medium, flex: 1 },
  itemQuantity: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  value: { fontSize: typography.size.base, fontWeight: typography.weight.medium, flexShrink: 1, textAlign: 'right' },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
});
