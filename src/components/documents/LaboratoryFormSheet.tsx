import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { Button, Sheet, TextField } from '@/components/ui';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createLaboratory, deleteLaboratory, updateLaboratory } from '@/services/laboratories';
import type { LaboratoryRow } from '@/types/database';

const laboratorySchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  contactName: z.string(),
  specialties: z.string(),
  notes: z.string(),
});

type LaboratoryFormValues = z.infer<typeof laboratorySchema>;

function defaultsFor(lab?: LaboratoryRow): LaboratoryFormValues {
  if (!lab) return { name: '', phone: '', email: '', address: '', contactName: '', specialties: '', notes: '' };
  return {
    name: lab.name,
    phone: lab.phone ?? '',
    email: lab.email ?? '',
    address: lab.address ?? '',
    contactName: lab.contact_name ?? '',
    specialties: lab.specialties ?? '',
    notes: lab.notes ?? '',
  };
}

interface LaboratoryFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  laboratory?: LaboratoryRow;
}

export function LaboratoryFormSheet({ visible, onClose, onSaved, laboratory }: LaboratoryFormSheetProps) {
  const theme = useAppTheme();
  const isEditing = !!laboratory;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LaboratoryFormValues>({
    resolver: zodResolver(laboratorySchema),
    defaultValues: defaultsFor(laboratory),
    values: visible ? defaultsFor(laboratory) : undefined,
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        name: values.name.trim(),
        phone: values.phone.trim() || null,
        email: values.email.trim() || null,
        address: values.address.trim() || null,
        contact_name: values.contactName.trim() || null,
        specialties: values.specialties.trim() || null,
        notes: values.notes.trim() || null,
      };
      if (isEditing) {
        await updateLaboratory(laboratory.id, payload);
      } else {
        await createLaboratory(payload);
      }
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handleDelete() {
    if (!laboratory) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await deleteLaboratory(laboratory.id);
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Modifier le laboratoire' : 'Nouveau laboratoire'}
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label={isEditing ? 'Enregistrer' : 'Créer le laboratoire'} onPress={onSubmit} loading={isSubmitting} fullWidth />
          {isEditing ? <Button label="Supprimer" variant="ghost" onPress={handleDelete} loading={isSubmitting} /> : null}
        </>
      }>
      <Controller control={control} name="name" render={({ field }) => <TextField label="Nom" required value={field.value} onChangeText={field.onChange} error={errors.name?.message} />} />
      <Controller control={control} name="contactName" render={({ field }) => <TextField label="Contact" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="phone" render={({ field }) => <TextField label="Téléphone" keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="email" render={({ field }) => <TextField label="Email" keyboardType="email-address" autoCapitalize="none" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="address" render={({ field }) => <TextField label="Adresse" multiline value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="specialties" render={({ field }) => <TextField label="Spécialités" multiline value={field.value} onChangeText={field.onChange} placeholder="Prothèses céramo-céramiques, gouttières..." />} />
      <Controller control={control} name="notes" render={({ field }) => <TextField label="Notes" multiline value={field.value} onChangeText={field.onChange} />} />
    </Sheet>
  );
}
