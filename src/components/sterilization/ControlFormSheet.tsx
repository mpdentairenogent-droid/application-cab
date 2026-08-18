import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ChipSelect, DateField, PhotoPickerField, PickerField, Sheet, TextField } from '@/components/ui';
import { CONTROL_TYPE_OPTIONS } from '@/constants/sterilizationLabels';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { toISODate } from '@/lib/format';
import { resolvePhotoUrl } from '@/lib/storage';
import { listAllEquipment } from '@/services/equipment';
import { createControl } from '@/services/sterilization';

const controlSchema = z.object({
  controlType: z.enum(['bowie_dick', 'helix', 'penetration_test', 'quality_control', 'filter_change', 'maintenance', 'periodic']),
  equipmentId: z.string().nullable(),
  performedAt: z.string(),
  result: z.enum(['pass', 'fail']),
  nextDueDate: z.string().nullable(),
  comment: z.string(),
  photoUrl: z.string().nullable(),
});

type ControlFormValues = z.infer<typeof controlSchema>;

function emptyDefaults(): ControlFormValues {
  return { controlType: 'bowie_dick', equipmentId: null, performedAt: toISODate(new Date()), result: 'pass', nextDueDate: null, comment: '', photoUrl: null };
}

interface ControlFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** §37 Contrôles stérilisation (Bowie-Dick, Helix, tests de pénétration...) avec rappel d'échéance. */
export function ControlFormSheet({ visible, onClose, onSaved }: ControlFormSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const equipmentQuery = useQuery({ queryKey: ['equipment-all'], queryFn: listAllEquipment, enabled: visible });
  const equipmentOptions = (equipmentQuery.data ?? []).map((e) => ({ value: e.id, label: e.name }));

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ControlFormValues>({ resolver: zodResolver(controlSchema), defaultValues: emptyDefaults(), values: visible ? emptyDefaults() : undefined });

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const photoUrl = await resolvePhotoUrl('sterilization-controls', values.photoUrl);
      await createControl({
        control_type: values.controlType,
        equipment_id: values.equipmentId,
        performed_at: values.performedAt,
        result: values.result,
        next_due_date: values.nextDueDate,
        comment: values.comment.trim() || null,
        photo_url: photoUrl,
        performed_by: profile.id,
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
      title="Nouveau contrôle"
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Enregistrer" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Controller
        control={control}
        name="controlType"
        render={({ field }) => <ChipSelect label="Type de contrôle" options={CONTROL_TYPE_OPTIONS} value={field.value} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="result"
        render={({ field }) => (
          <ChipSelect
            label="Résultat"
            options={[
              { value: 'pass' as const, label: 'Réussi' },
              { value: 'fail' as const, label: 'Échoué' },
            ]}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="equipmentId"
        render={({ field }) => <PickerField label="Appareil" options={equipmentOptions} value={field.value} onChange={field.onChange} clearable />}
      />
      <Controller control={control} name="performedAt" render={({ field }) => <DateField label="Date" value={field.value} onChange={field.onChange} />} />
      <Controller
        control={control}
        name="nextDueDate"
        render={({ field }) => <DateField label="Prochaine échéance (optionnel)" value={field.value} onChange={field.onChange} clearable />}
      />
      <Controller
        control={control}
        name="comment"
        render={({ field }) => <TextField label="Commentaire (optionnel)" multiline value={field.value} onChangeText={field.onChange} error={errors.comment?.message} />}
      />
      <Controller
        control={control}
        name="photoUrl"
        render={({ field }) => <PhotoPickerField label="Photo de l'étiquette (optionnel)" value={field.value} onChange={field.onChange} />}
      />
    </Sheet>
  );
}