import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { Button, Sheet, TextField } from '@/components/ui';
import { CATEGORY_COLORS } from '@/constants/categoryColors';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createStockCategory, deleteStockCategory, updateStockCategory } from '@/services/stockCategories';
import type { StockCategoryRow } from '@/types/database';

const categorySchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  color: z.string(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (category: StockCategoryRow) => void;
  onDeleted?: () => void;
  category?: StockCategoryRow;
}

function defaultsFor(category?: StockCategoryRow): CategoryFormValues {
  if (!category) return { name: '', color: CATEGORY_COLORS[0] };
  return { name: category.name, color: category.color };
}

/** Création/édition d'une catégorie de stock — nom + couleur (nuancier fixe, voir CATEGORY_COLORS), réutilisée par l'écran Catégories et par CategoryPickerField (création à la volée). */
export function CategoryFormSheet({ visible, onClose, onSaved, onDeleted, category }: CategoryFormSheetProps) {
  const theme = useAppTheme();
  const isEditing = !!category;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema), defaultValues: defaultsFor(category), values: visible ? defaultsFor(category) : undefined });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = { name: values.name.trim(), color: values.color };
      if (isEditing) {
        await updateStockCategory(category.id, payload);
        onSaved({ ...category, ...payload });
      } else {
        const created = await createStockCategory(payload);
        onSaved(created);
      }
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handleDelete() {
    if (!category) return;
    setIsSubmitting(true);
    try {
      await deleteStockCategory(category.id);
      onDeleted?.();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      footer={
        confirmingDelete ? (
          <View style={styles.confirmRow}>
            <Button label="Annuler" variant="outline" onPress={() => setConfirmingDelete(false)} />
            <Button label="Supprimer" variant="danger" onPress={handleDelete} loading={isSubmitting} />
          </View>
        ) : (
          <View style={styles.footerColumn}>
            {submitError ? <Text style={[styles.error, { color: theme.danger }]}>{submitError}</Text> : null}
            <Button label={isEditing ? 'Enregistrer' : 'Créer la catégorie'} onPress={onSubmit} loading={isSubmitting} fullWidth />
            {isEditing ? <Button label="Supprimer" variant="ghost" onPress={() => setConfirmingDelete(true)} /> : null}
          </View>
        )
      }>
      <Controller control={control} name="name" render={({ field }) => <TextField label="Nom" required value={field.value} onChangeText={field.onChange} error={errors.name?.message} placeholder="Ex. Consommables" />} />
      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <View style={styles.colorSection}>
            <Text style={[styles.colorLabel, { color: theme.textSecondary }]}>Couleur</Text>
            <View style={styles.colorRow}>
              {CATEGORY_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => field.onChange(color)}
                  accessibilityRole="button"
                  accessibilityLabel={`Couleur ${color}`}
                  style={[styles.swatch, { backgroundColor: color }, field.value === color ? { borderColor: theme.textPrimary, borderWidth: 3 } : null]}
                />
              ))}
            </View>
          </View>
        )}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  footerColumn: { gap: spacing.sm },
  confirmRow: { flexDirection: 'row', gap: spacing.sm },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
  colorSection: { gap: spacing.xs },
  colorLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: 36, height: 36, borderRadius: radius.full },
});
