import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { Button, Sheet, TextField } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createSupplier, deleteSupplier, updateSupplier } from '@/services/suppliers';
import type { SupplierRow } from '@/types/database';

const supplierSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  category: z.string(),
  salesRepName: z.string(),
  phone: z.string(),
  email: z.string(),
  website: z.string(),
  notes: z.string(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (supplier: SupplierRow) => void;
  supplier?: SupplierRow;
  /** Nom pré-rempli à la création rapide depuis un autre écran (ex. fournisseur non reconnu au scan d'une facture). Ignoré en édition. */
  defaultName?: string;
}

function defaultsFor(supplier?: SupplierRow, defaultName?: string): SupplierFormValues {
  if (!supplier) return { name: defaultName ?? '', category: '', salesRepName: '', phone: '', email: '', website: '', notes: '' };
  return {
    name: supplier.name,
    category: supplier.category ?? '',
    salesRepName: supplier.sales_rep_name ?? '',
    phone: supplier.phone ?? '',
    email: supplier.email ?? '',
    website: supplier.website ?? '',
    notes: supplier.notes ?? '',
  };
}

export function SupplierFormSheet({ visible, onClose, onSaved, supplier, defaultName }: SupplierFormSheetProps) {
  const theme = useAppTheme();
  const isEditing = !!supplier;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: defaultsFor(supplier, defaultName),
    values: visible ? defaultsFor(supplier, defaultName) : undefined,
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        name: values.name.trim(),
        category: values.category.trim() || null,
        sales_rep_name: values.salesRepName.trim() || null,
        phone: values.phone.trim() || null,
        email: values.email.trim() || null,
        website: values.website.trim() || null,
        notes: values.notes.trim() || null,
      };
      const saved = isEditing ? await updateSupplier(supplier.id, payload) : await createSupplier(payload);
      onSaved(saved);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handleDelete() {
    if (!supplier) return;
    setIsSubmitting(true);
    try {
      await deleteSupplier(supplier.id);
      onSaved(supplier);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
      footer={
        confirmingDelete ? (
          <View style={styles.confirmRow}>
            <Button label="Annuler" variant="outline" onPress={() => setConfirmingDelete(false)} />
            <Button label="Supprimer" variant="danger" onPress={handleDelete} loading={isSubmitting} />
          </View>
        ) : (
          <View style={styles.footerColumn}>
            {submitError ? <Text style={[styles.error, { color: theme.danger }]}>{submitError}</Text> : null}
            <Button label={isEditing ? 'Enregistrer' : 'Créer le fournisseur'} onPress={onSubmit} loading={isSubmitting} fullWidth />
            {isEditing ? <Button label="Supprimer" variant="ghost" onPress={() => setConfirmingDelete(true)} /> : null}
          </View>
        )
      }>
      <Controller control={control} name="name" render={({ field }) => <TextField label="Nom" required value={field.value} onChangeText={field.onChange} error={errors.name?.message} />} />
      <Controller control={control} name="category" render={({ field }) => <TextField label="Catégorie" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="salesRepName" render={({ field }) => <TextField label="Interlocuteur commercial" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="phone" render={({ field }) => <TextField label="Téléphone" keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="email" render={({ field }) => <TextField label="Email" keyboardType="email-address" autoCapitalize="none" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="website" render={({ field }) => <TextField label="Site web" autoCapitalize="none" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="notes" render={({ field }) => <TextField label="Notes" multiline value={field.value} onChangeText={field.onChange} />} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  footerColumn: { gap: spacing.sm },
  confirmRow: { flexDirection: 'row', gap: spacing.sm },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
});