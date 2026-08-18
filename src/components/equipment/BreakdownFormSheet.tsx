import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ChipSelect, PickerField, Sheet, TextField } from '@/components/ui';
import { URGENCY_OPTIONS } from '@/constants/equipmentLabels';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createBreakdown, listAllEquipment } from '@/services/equipment';
import type { EquipmentRow } from '@/types/database';

const breakdownSchema = z.object({
  equipmentId: z.string().nullable(),
  description: z.string().min(1, 'La description est obligatoire'),
  urgency: z.enum(['low', 'normal', 'high', 'urgent']),
});

type BreakdownFormValues = z.infer<typeof breakdownSchema>;

function emptyDefaults(equipmentId: string | null): BreakdownFormValues {
  return { equipmentId, description: '', urgency: 'normal' };
}

interface BreakdownFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Si fourni, l'équipement est présélectionné (accès rapide depuis sa fiche) et n'est plus modifiable. */
  equipment?: EquipmentRow;
}

/** §39 Pannes : action rapide "Signaler une panne" — description + urgence, le reste est automatique. */
export function BreakdownFormSheet({ visible, onClose, onSaved, equipment }: BreakdownFormSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const equipmentQuery = useQuery({ queryKey: ['equipment-all'], queryFn: listAllEquipment, enabled: visible && !equipment });
  const equipmentOptions = (equipmentQuery.data ?? []).map((e) => ({ value: e.id, label: e.name }));

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BreakdownFormValues>({
    resolver: zodResolver(breakdownSchema),
    defaultValues: emptyDefaults(equipment?.id ?? null),
    values: visible ? emptyDefaults(equipment?.id ?? null) : undefined,
  });

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createBreakdown({
        equipment_id: values.equipmentId,
        description: values.description.trim(),
        urgency: values.urgency,
        reported_by: profile.id,
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
      title="Signaler une panne"
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Signaler" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      {equipment ? (
        <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: theme.textPrimary }}>{equipment.name}</Text>
      ) : (
        <Controller
          control={control}
          name="equipmentId"
          render={({ field }) => <PickerField label="Équipement (optionnel)" options={equipmentOptions} value={field.value} onChange={field.onChange} clearable />}
        />
      )}
      <Controller
        control={control}
        name="description"
        render={({ field }) => <TextField label="Description" required multiline value={field.value} onChangeText={field.onChange} error={errors.description?.message} />}
      />
      <Controller control={control} name="urgency" render={({ field }) => <ChipSelect label="Urgence" options={URGENCY_OPTIONS} value={field.value} onChange={field.onChange} />} />
    </Sheet>
  );
}