import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { Button, DateField, Sheet, TextField } from '@/components/ui';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { toISODate } from '@/lib/format';
import { createMaintenanceRecord } from '@/services/equipment';
import type { EquipmentRow } from '@/types/database';

const maintenanceSchema = z.object({
  performedAt: z.string(),
  description: z.string(),
  cost: z.string(),
  nextDueDate: z.string().nullable(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

function emptyDefaults(): MaintenanceFormValues {
  return { performedAt: toISODate(new Date()), description: '', cost: '', nextDueDate: null };
}

interface MaintenanceRecordFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  equipment?: EquipmentRow;
}

export function MaintenanceRecordFormSheet({ visible, onClose, onSaved, equipment }: MaintenanceRecordFormSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
  } = useForm<MaintenanceFormValues>({ resolver: zodResolver(maintenanceSchema), defaultValues: emptyDefaults(), values: visible ? emptyDefaults() : undefined });

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!equipment) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const cost = values.cost.trim() ? Number.parseFloat(values.cost.replace(',', '.')) : null;
      await createMaintenanceRecord({
        equipment_id: equipment.id,
        performed_at: values.performedAt,
        performed_by: profile?.id ?? null,
        description: values.description.trim() || null,
        cost: cost != null && Number.isFinite(cost) ? cost : null,
        next_due_date: values.nextDueDate,
      });
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title={equipment ? `Maintenance — ${equipment.name}` : 'Maintenance'}
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Enregistrer" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Controller control={control} name="performedAt" render={({ field }) => <DateField label="Date" value={field.value} onChange={field.onChange} />} />
      <Controller control={control} name="description" render={({ field }) => <TextField label="Description" multiline value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="cost" render={({ field }) => <TextField label="Coût (€)" keyboardType="numeric" value={field.value} onChangeText={field.onChange} />} />
      <Controller
        control={control}
        name="nextDueDate"
        render={({ field }) => <DateField label="Prochaine maintenance (optionnel)" value={field.value} onChange={field.onChange} clearable />}
      />
    </Sheet>
  );
}