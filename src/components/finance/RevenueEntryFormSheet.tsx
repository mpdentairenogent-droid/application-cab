import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { Button, ChipSelect, DateField, PickerField, Sheet, TextField } from '@/components/ui';
import { PROCEDURE_TYPE_OPTIONS } from '@/constants/financeLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { toISODate } from '@/lib/format';
import {
  createRevenueEntry,
  deleteRevenueEntry,
  listActivePractitioners,
  listRevenueEntryDetails,
  replaceRevenueEntryDetails,
  updateRevenueEntry,
} from '@/services/revenue';
import type { RevenueEntryDetailRow, RevenueEntryRow } from '@/types/database';

const detailSchema = z.object({
  procedureType: z.enum(['soins', 'prosthesis', 'implant', 'surgery', 'orthodontics', 'periodontics', 'esthetics', 'other']),
  amount: z.string().min(1, 'Montant requis'),
});

const entrySchema = z.object({
  practitionerId: z.string().min(1, 'Praticien requis'),
  entryDate: z.string(),
  amount: z.string().min(1, 'Montant requis'),
  workedDay: z.enum(['yes', 'no']),
  patientCount: z.string(),
  comment: z.string(),
  details: z.array(detailSchema),
});

type EntryFormValues = z.infer<typeof entrySchema>;

function toAmountNumber(value: string): number {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function defaultsFor(entry?: RevenueEntryRow, defaultPractitionerId?: string, details?: RevenueEntryDetailRow[], defaultDate?: string): EntryFormValues {
  if (!entry) {
    return {
      practitionerId: defaultPractitionerId ?? '',
      entryDate: defaultDate ?? toISODate(new Date()),
      amount: '',
      workedDay: 'yes',
      patientCount: '',
      comment: '',
      details: [],
    };
  }
  return {
    practitionerId: entry.practitioner_id,
    entryDate: entry.entry_date,
    amount: String(entry.amount),
    workedDay: entry.worked_day ? 'yes' : 'no',
    patientCount: entry.patient_count != null ? String(entry.patient_count) : '',
    comment: entry.comment ?? '',
    details: (details ?? []).map((d) => ({ procedureType: d.procedure_type, amount: String(d.amount) })),
  };
}

interface RevenueEntryFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  entry?: RevenueEntryRow;
  defaultPractitionerId?: string;
  /** Pré-remplit la date sur la période actuellement parcourue plutôt qu'aujourd'hui (voir CA en navigation par mois). */
  defaultDate?: string;
}

export function RevenueEntryFormSheet({ visible, onClose, onSaved, entry, defaultPractitionerId, defaultDate }: RevenueEntryFormSheetProps) {
  const theme = useAppTheme();
  const isEditing = !!entry;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const practitionersQuery = useQuery({ queryKey: ['practitioners-active'], queryFn: listActivePractitioners, enabled: visible });
  const practitionerOptions = (practitionersQuery.data ?? []).map((p) => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }));

  const detailsQuery = useQuery({
    queryKey: ['revenue-entry-details', entry?.id],
    queryFn: () => listRevenueEntryDetails(entry!.id),
    enabled: visible && !!entry,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: defaultsFor(entry, defaultPractitionerId, undefined, defaultDate),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'details' });
  const watchedDetails = useWatch({ control, name: 'details' });
  const watchedAmount = useWatch({ control, name: 'amount' });
  const detailsSum = watchedDetails.reduce((sum, d) => sum + toAmountNumber(d.amount), 0);

  // Les lignes de détail viennent d'une requête async (listRevenueEntryDetails) : contrairement au
  // reste du formulaire (défauts connus dès l'ouverture via `entry`), elles n'arrivent qu'une fois
  // la fiche chargée — un reset() ici plutôt que le pattern `values: visible ? ... : undefined`
  // utilisé ailleurs, qui suppose des défauts synchrones.
  useEffect(() => {
    if (!visible) return;
    if (entry && detailsQuery.data) {
      reset(defaultsFor(entry, defaultPractitionerId, detailsQuery.data));
    } else if (!entry) {
      reset(defaultsFor(undefined, defaultPractitionerId, undefined, defaultDate));
      setShowDetails(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, entry?.id, detailsQuery.data, defaultDate]);

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const amount = toAmountNumber(values.amount);
      const patientCount = values.patientCount.trim() ? Number.parseInt(values.patientCount, 10) : null;
      const payload = {
        practitioner_id: values.practitionerId,
        entry_date: values.entryDate,
        amount,
        worked_day: values.workedDay === 'yes',
        patient_count: patientCount != null && Number.isFinite(patientCount) ? patientCount : null,
        comment: values.comment.trim() || null,
      };
      const entryId = isEditing ? entry.id : (await createRevenueEntry(payload)).id;
      if (isEditing) await updateRevenueEntry(entry.id, payload);
      await replaceRevenueEntryDetails(
        entryId,
        values.details.map((d) => ({ procedureType: d.procedureType, amount: toAmountNumber(d.amount) }))
      );
      onSaved();
    } catch (error) {
      const isDuplicateEntry = typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === '23505';
      setSubmitError(isDuplicateEntry ? 'Une entrée existe déjà pour ce praticien à cette date. Modifie-la plutôt depuis la liste.' : getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handleDelete() {
    if (!entry) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await deleteRevenueEntry(entry.id);
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
      title={isEditing ? 'Modifier le CA' : 'Nouveau CA'}
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Enregistrer" onPress={onSubmit} loading={isSubmitting} fullWidth />
          {isEditing ? <Button label="Supprimer" variant="ghost" onPress={handleDelete} loading={isSubmitting} /> : null}
        </>
      }>
      <Controller
        control={control}
        name="practitionerId"
        render={({ field }) => (
          <PickerField label="Praticien" required options={practitionerOptions} value={field.value || null} onChange={(v) => field.onChange(v ?? '')} error={errors.practitionerId?.message} />
        )}
      />
      <Controller control={control} name="entryDate" render={({ field }) => <DateField label="Date" value={field.value} onChange={field.onChange} />} />
      <Controller
        control={control}
        name="amount"
        render={({ field }) => <TextField label="CA (€)" required keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} error={errors.amount?.message} />}
      />
      <Controller
        control={control}
        name="workedDay"
        render={({ field }) => (
          <ChipSelect
            label="Jour travaillé"
            options={[
              { value: 'yes' as const, label: 'Oui' },
              { value: 'no' as const, label: 'Non' },
            ]}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="patientCount"
        render={({ field }) => <TextField label="Nombre de patients (optionnel)" keyboardType="numeric" value={field.value} onChangeText={field.onChange} />}
      />
      <Controller control={control} name="comment" render={({ field }) => <TextField label="Commentaire (optionnel)" multiline value={field.value} onChangeText={field.onChange} />} />

      <Pressable onPress={() => setShowDetails((v) => !v)} style={styles.detailsToggle} accessibilityRole="button">
        <Text style={[styles.detailsTitle, { color: theme.textPrimary }]}>Détail par type d&apos;acte (optionnel)</Text>
        <Ionicons name={showDetails ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textSecondary} />
      </Pressable>

      {showDetails ? (
        <View style={styles.detailsSection}>
          {fields.map((field, index) => (
            <View key={field.id} style={styles.detailRow}>
              <Controller
                control={control}
                name={`details.${index}.procedureType`}
                render={({ field: f }) => (
                  <View style={styles.detailTypeWrapper}>
                    <ChipSelect label={`Acte ${index + 1}`} options={PROCEDURE_TYPE_OPTIONS} value={f.value} onChange={f.onChange} />
                  </View>
                )}
              />
              <View style={styles.detailAmountRow}>
                <Controller
                  control={control}
                  name={`details.${index}.amount`}
                  render={({ field: f }) => (
                    <View style={styles.flex1}>
                      <TextField label="Montant (€)" keyboardType="decimal-pad" value={f.value} onChangeText={f.onChange} error={errors.details?.[index]?.amount?.message} />
                    </View>
                  )}
                />
                <Pressable onPress={() => remove(index)} accessibilityRole="button" accessibilityLabel="Retirer cet acte" hitSlop={8} style={styles.removeButton}>
                  <Ionicons name="close-circle" size={26} color={theme.danger} />
                </Pressable>
              </View>
            </View>
          ))}
          <Button label="+ Ajouter un acte" variant="ghost" onPress={() => append({ procedureType: 'soins', amount: '' })} />
          {fields.length > 0 ? (
            <Text style={[styles.detailsSum, { color: Math.abs(detailsSum - toAmountNumber(watchedAmount)) < 0.01 ? theme.success : theme.textMuted }]}>
              Somme du détail : {detailsSum.toFixed(2)} € {watchedAmount ? `(total saisi : ${toAmountNumber(watchedAmount).toFixed(2)} €)` : ''}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  detailsToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailsTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  detailsSection: { gap: spacing.md },
  detailRow: { gap: spacing.sm, paddingBottom: spacing.sm },
  detailTypeWrapper: { marginBottom: -spacing.sm },
  detailAmountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  flex1: { flex: 1 },
  removeButton: { marginBottom: spacing.sm },
  detailsSum: { fontSize: typography.size.xs, textAlign: 'center' },
});
