import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Badge, Button, Card, Divider, LoadingState, Sheet } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { EQUIPMENT_STATUS_LABEL, EQUIPMENT_STATUS_TONE } from '@/constants/equipmentLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency, formatDate } from '@/lib/format';
import { usePermissions } from '@/permissions/usePermissions';
import { deleteEquipment, listMaintenanceRecords } from '@/services/equipment';
import type { EquipmentRow } from '@/types/database';

interface EquipmentDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  equipment?: EquipmentRow;
  onEdit: () => void;
  onReportBreakdown: () => void;
  onAddMaintenance: () => void;
  onDeleted: () => void;
}

export function EquipmentDetailSheet({ visible, onClose, equipment, onEdit, onReportBreakdown, onAddMaintenance, onDeleted }: EquipmentDetailSheetProps) {
  const theme = useAppTheme();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.MANAGE_EQUIPMENT);
  const [showQr, setShowQr] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const maintenanceQuery = useQuery({
    queryKey: ['maintenance-records', equipment?.id],
    queryFn: () => listMaintenanceRecords(equipment!.id),
    enabled: visible && !!equipment,
  });

  if (!equipment) return null;

  function handleClose() {
    setShowQr(false);
    setDeleteError(null);
    onClose();
  }

  function handleDeletePress() {
    Alert.alert(
      'Supprimer cet équipement ?',
      `« ${equipment!.name} » et son historique de maintenance seront définitivement supprimés. Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteEquipment(equipment!.id);
      onDeleted();
    } catch (error) {
      setDeleteError(getErrorMessage(error));
      setIsDeleting(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title={equipment.name}
      footer={
        <View style={styles.footerRow}>
          {/* §39 : signaler une panne est ouvert à tout le personnel actif (RLS
              is_active_staff), pas seulement à qui a manage_equipment. */}
          <View style={styles.flex1}>
            <Button label="Signaler une panne" variant="outline" onPress={onReportBreakdown} fullWidth />
          </View>
          {canManage ? (
            <View style={styles.flex1}>
              <Button label="Modifier" onPress={onEdit} fullWidth />
            </View>
          ) : null}
        </View>
      }>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Statut</Text>
        <Badge label={EQUIPMENT_STATUS_LABEL[equipment.status]} tone={EQUIPMENT_STATUS_TONE[equipment.status]} />
      </View>
      {equipment.category ? (
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Catégorie</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>{equipment.category}</Text>
        </View>
      ) : null}
      {equipment.brand || equipment.model ? (
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Marque / modèle</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>{[equipment.brand, equipment.model].filter(Boolean).join(' · ')}</Text>
        </View>
      ) : null}
      {equipment.serial_number ? (
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>N° série</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>{equipment.serial_number}</Text>
        </View>
      ) : null}
      {equipment.warranty_until ? (
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Garantie jusqu&apos;au</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>{formatDate(equipment.warranty_until)}</Text>
        </View>
      ) : null}
      {equipment.maintenance_company ? (
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Maintenance</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>
            {equipment.maintenance_company}
            {equipment.maintenance_phone ? ` · ${equipment.maintenance_phone}` : ''}
          </Text>
        </View>
      ) : null}
      {equipment.notes ? (
        <View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Notes</Text>
          <Text style={[styles.value, { color: theme.textPrimary, textAlign: 'left' }]}>{equipment.notes}</Text>
        </View>
      ) : null}

      <Divider />

      {/* §40 : QR à coller sur l'appareil — scanné, il ramène directement à cette fiche. */}
      <View style={styles.row}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>QR code</Text>
        <Button label={showQr ? 'Masquer' : 'Afficher'} variant="ghost" onPress={() => setShowQr((v) => !v)} />
      </View>
      {showQr ? (
        <View style={styles.qrContainer}>
          <QRCode value={equipment.id} size={180} backgroundColor={theme.surface} color={theme.textPrimary} />
        </View>
      ) : null}

      <Divider />

      <View style={styles.row}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Historique de maintenance</Text>
        {canManage ? <Button label="Ajouter" variant="ghost" onPress={onAddMaintenance} /> : null}
      </View>

      {maintenanceQuery.isLoading ? (
        <LoadingState label="Chargement..." />
      ) : maintenanceQuery.data?.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textMuted }]}>Aucun enregistrement de maintenance</Text>
      ) : (
        <View style={styles.list}>
          {maintenanceQuery.data?.map((record) => (
            <Card key={record.id} style={styles.recordCard}>
              <View style={styles.rowBetween}>
                <Text style={[styles.value, { color: theme.textPrimary }]}>{formatDate(record.performed_at)}</Text>
                {record.cost != null ? <Text style={[styles.value, { color: theme.textPrimary }]}>{formatCurrency(record.cost)}</Text> : null}
              </View>
              {record.description ? <Text style={[styles.recordDescription, { color: theme.textSecondary }]}>{record.description}</Text> : null}
              {record.next_due_date ? (
                <Text style={[styles.recordDescription, { color: theme.textMuted }]}>Prochaine échéance : {formatDate(record.next_due_date)}</Text>
              ) : null}
            </Card>
          ))}
        </View>
      )}

      {canManage ? (
        <>
          <Divider />
          {deleteError ? <Text style={[styles.error, { color: theme.danger }]}>{deleteError}</Text> : null}
          <Button label="Supprimer l'équipement" variant="ghost" onPress={handleDeletePress} loading={isDeleting} />
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  value: { fontSize: typography.size.base, fontWeight: typography.weight.medium, flexShrink: 1, textAlign: 'right' },
  sectionTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  empty: { fontSize: typography.size.sm, textAlign: 'center', paddingVertical: spacing.md },
  list: { gap: spacing.sm },
  recordCard: { gap: spacing.xs },
  recordDescription: { fontSize: typography.size.sm },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  flex1: { flex: 1 },
  qrContainer: { alignItems: 'center', paddingVertical: spacing.md },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
});
