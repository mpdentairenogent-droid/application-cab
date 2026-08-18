import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ChipSelect, DateField, Sheet, TextField } from '@/components/ui';
import { ABSENCE_TYPE_OPTIONS } from '@/constants/organizationLabels';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { createAbsence } from '@/services/absences';
import { getErrorMessage } from '@/lib/errors';
import { toISODate } from '@/lib/format';

const absenceSchema = z
  .object({
    absenceType: z.enum(['leave', 'training', 'sick', 'recovery', 'other']),
    startDate: z.string(),
    endDate: z.string(),
    comment: z.string(),
  })
  .refine((values) => values.endDate >= values.startDate, { message: 'La date de fin doit être après la date de début', path: ['endDate'] });

type AbsenceFormValues = z.infer<typeof absenceSchema>;

function emptyDefaults(): AbsenceFormValues {
  const today = toISODate(new Date());
  return { absenceType: 'leave', startDate: today, endDate: today, comment: '' };
}

interface AbsenceFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AbsenceFormSheet({ visible, onClose, onSaved }: AbsenceFormSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AbsenceFormValues>({ resolver: zodResolver(absenceSchema), defaultValues: emptyDefaults(), values: visible ? emptyDefaults() : undefined });

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createAbsence({
        user_id: profile.id,
        absence_type: values.absenceType,
        start_date: values.startDate,
        end_date: values.endDate,
        comment: values.comment.trim() || null,
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
      title="Demander une absence"
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Envoyer la demande" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Controller
        control={control}
        name="absenceType"
        render={({ field }) => <ChipSelect label="Type" options={ABSENCE_TYPE_OPTIONS} value={field.value} onChange={field.onChange} />}
      />
      <Controller control={control} name="startDate" render={({ field }) => <DateField label="Du" value={field.value} onChange={field.onChange} />} />
      <Controller control={control} name="endDate" render={({ field }) => <DateField label="Au" value={field.value} onChange={field.onChange} error={errors.endDate?.message} />} />
      <Controller control={control} name="comment" render={({ field }) => <TextField label="Commentaire (optionnel)" multiline value={field.value} onChangeText={field.onChange} />} />
    </Sheet>
  );
}
