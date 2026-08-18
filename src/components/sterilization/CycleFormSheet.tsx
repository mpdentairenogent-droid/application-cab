import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ChipSelect, PhotoPickerField, PickerField, Sheet, TextField } from '@/components/ui';
import { CYCLE_RESULT_OPTIONS } from '@/constants/sterilizationLabels';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { resolvePhotoUrl } from '@/lib/storage';
import { listAllEquipment } from '@/services/equipment';
import { createCycle } from '@/services/sterilization';
import type { SterilizationCycleRow } from '@/types/database';

const cycleSchema = z.object({
  equipmentId: z.string().nullable(),
  cycleNumber: z.string(),
  program: z.string(),
  batchNumber: z.string(),
  result: z.enum(['conforming', 'non_conforming']),
  comment: z.string(),
  photoUrl: z.string().nullable(),
});

type CycleFormValues = z.infer<typeof cycleSchema>;

export interface CyclePrefill {
  cycleNumber: string | null;
  program: string | null;
  batchNumber: string | null;
  /** null = résultat non déterminé par le scan IA (voir ScanCycleLabelSheet) — jamais deviné, à confirmer soi-même. */
  result: 'conforming' | 'non_conforming' | null;
  comment: string | null;
  photoUrl: string;
}

function defaultsFor(prefill?: CyclePrefill): CycleFormValues {
  return {
    equipmentId: null,
    cycleNumber: prefill?.cycleNumber ?? '',
    program: prefill?.program ?? '',
    batchNumber: prefill?.batchNumber ?? '',
    result: prefill?.result ?? 'conforming',
    comment: prefill?.comment ?? '',
    photoUrl: prefill?.photoUrl ?? null,
  };
}

interface CycleFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (cycle: SterilizationCycleRow) => void;
  prefill?: CyclePrefill;
}

/** §34 : l'enregistrement d'un cycle doit être extrêmement rapide — champs minimaux, tout facultatif sauf le résultat. */
export function CycleFormSheet({ visible, onClose, onSaved, prefill }: CycleFormSheetProps) {
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
  } = useForm<CycleFormValues>({ resolver: zodResolver(cycleSchema), defaultValues: defaultsFor(prefill), values: visible ? defaultsFor(prefill) : undefined });

  // Un scan a eu lieu (prefill fourni) mais l'IA n'a pas pu lire le résultat
  // avec certitude — le champ reste à sa valeur par défaut ("conforming"),
  // ce qui serait dangereux à manquer : signalé explicitement plutôt que
  // silencieusement laissé identique à une saisie manuelle classique.
  const resultUncertain = !!prefill && prefill.result === null;

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const photoUrl = await resolvePhotoUrl('sterilization-cycles', values.photoUrl);
      const cycle = await createCycle({
        equipment_id: values.equipmentId,
        cycle_number: values.cycleNumber.trim() || null,
        program: values.program.trim() || null,
        batch_number: values.batchNumber.trim() || null,
        result: values.result,
        comment: values.comment.trim() || null,
        photo_url: photoUrl,
        performed_by: profile.id,
      });
      onSaved(cycle);
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
      title="Nouveau cycle de stérilisation"
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Enregistrer" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Controller
        control={control}
        name="result"
        render={({ field }) => <ChipSelect label="Résultat" options={CYCLE_RESULT_OPTIONS} value={field.value} onChange={field.onChange} />}
      />
      {resultUncertain ? (
        <Text style={{ fontSize: typography.size.xs, color: theme.warning, marginTop: -12 }}>
          Le résultat n&apos;a pas pu être lu automatiquement sur la photo — vérifie-le toi-même avant d&apos;enregistrer.
        </Text>
      ) : null}
      <Controller control={control} name="photoUrl" render={({ field }) => <PhotoPickerField label="Photo de l'étiquette (optionnel)" value={field.value} onChange={field.onChange} />} />
      <Controller
        control={control}
        name="equipmentId"
        render={({ field }) => (
          <PickerField label="Appareil (autoclave...)" options={equipmentOptions} value={field.value} onChange={field.onChange} clearable />
        )}
      />
      <Controller control={control} name="cycleNumber" render={({ field }) => <TextField label="Numéro de cycle" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="program" render={({ field }) => <TextField label="Programme" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="batchNumber" render={({ field }) => <TextField label="Numéro de lot" value={field.value} onChangeText={field.onChange} />} />
      <Controller
        control={control}
        name="comment"
        render={({ field }) => <TextField label="Commentaire (optionnel)" multiline value={field.value} onChangeText={field.onChange} error={errors.comment?.message} />}
      />
    </Sheet>
  );
}