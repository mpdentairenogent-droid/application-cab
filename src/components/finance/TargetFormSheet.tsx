import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { Button, ChipSelect, DateField, PickerField, Sheet, TextField } from '@/components/ui';
import { TARGET_PERIOD_OPTIONS } from '@/constants/financeLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { formatDate, toISODate } from '@/lib/format';
import { deleteTarget, listActivePractitioners, upsertTarget } from '@/services/revenue';
import type { FinancialTargetRow } from '@/types/database';

const targetSchema = z.object({
  scope: z.enum(['cabinet', 'individual']),
  practitionerId: z.string().nullable(),
  periodType: z.enum(['daily', 'monthly', 'yearly']),
  periodStart: z.string(),
  amount: z.string().min(1, 'Montant requis'),
});

type TargetFormValues = z.infer<typeof targetSchema>;

function emptyDefaults(): TargetFormValues {
  return { scope: 'cabinet', practitionerId: null, periodType: 'monthly', periodStart: toISODate(new Date()), amount: '' };
}

/** Aligne la date choisie sur le vrai début de période — les requêtes de lecture cherchent period_start exact (1er du mois, 1er janvier...). */
function normalizePeriodStart(dateStr: string, periodType: FinancialTargetRow['period_type']): string {
  const [year, month] = dateStr.split('-').map(Number);
  if (periodType === 'yearly') return toISODate(new Date(year, 0, 1));
  if (periodType === 'monthly') return toISODate(new Date(year, month - 1, 1));
  return dateStr;
}

interface TargetFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  target?: FinancialTargetRow;
}

export function TargetFormSheet({ visible, onClose, onSaved, target }: TargetFormSheetProps) {
  const theme = useAppTheme();
  const isEditing = !!target;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const practitionersQuery = useQuery({ queryKey: ['practitioners-active'], queryFn: listActivePractitioners, enabled: visible });
  const practitionerOptions = (practitionersQuery.data ?? []).map((p) => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }));

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TargetFormValues>({
    resolver: zodResolver(targetSchema),
    defaultValues: emptyDefaults(),
    values: visible ? emptyDefaults() : undefined,
  });

  const scope = watch('scope');

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const amount = Number.parseFloat(values.amount.replace(',', '.'));
      await upsertTarget({
        practitioner_id: values.scope === 'individual' ? values.practitionerId : null,
        period_type: values.periodType,
        period_start: normalizePeriodStart(values.periodStart, values.periodType),
        target_amount: Number.isFinite(amount) ? amount : 0,
      });
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handleDelete() {
    if (!target) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await deleteTarget(target.id);
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title={isEditing ? "Modifier l'objectif" : 'Nouvel objectif'}
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Enregistrer" onPress={onSubmit} loading={isSubmitting} fullWidth />
          {isEditing ? <Button label="Supprimer" variant="ghost" onPress={handleDelete} loading={isSubmitting} /> : null}
        </>
      }>
      {isEditing ? (
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: typography.size.sm, color: theme.textSecondary }}>
            {target.practitioner_id ? 'Objectif individuel' : 'Objectif cabinet entier'} ·{' '}
            {TARGET_PERIOD_OPTIONS.find((o) => o.value === target.period_type)?.label} · {formatDate(target.period_start)}
          </Text>
        </View>
      ) : (
        <>
          <Controller
            control={control}
            name="scope"
            render={({ field }) => (
              <ChipSelect
                label="Portée"
                options={[
                  { value: 'cabinet' as const, label: 'Cabinet entier' },
                  { value: 'individual' as const, label: 'Un praticien' },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {scope === 'individual' ? (
            <Controller
              control={control}
              name="practitionerId"
              render={({ field }) => <PickerField label="Praticien" options={practitionerOptions} value={field.value} onChange={field.onChange} />}
            />
          ) : null}
          <Controller
            control={control}
            name="periodType"
            render={({ field }) => <ChipSelect label="Période" options={TARGET_PERIOD_OPTIONS} value={field.value} onChange={field.onChange} />}
          />
          <Controller control={control} name="periodStart" render={({ field }) => <DateField label="Date dans la période visée" value={field.value} onChange={field.onChange} />} />
        </>
      )}
      <Controller
        control={control}
        name="amount"
        render={({ field }) => <TextField label="Montant de l'objectif (€)" required keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} error={errors.amount?.message} />}
      />
    </Sheet>
  );
}