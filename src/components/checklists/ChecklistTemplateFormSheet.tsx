import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { Button, ChipSelect, Sheet, TextField } from '@/components/ui';
import { CHECKLIST_CATEGORY_OPTIONS } from '@/constants/organizationLabels';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createChecklistTemplate } from '@/services/checklists';
import type { ChecklistItem, ChecklistTemplateRow } from '@/types/database';

const templateSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  category: z.enum(['opening', 'closing', 'sterilization', 'room_check', 'cleaning', 'end_of_day', 'weekly_check', 'other']),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

function newItem(): ChecklistItem {
  return { id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label: '' };
}

interface ChecklistTemplateFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** §41 : modèles de check-list configurables — création/édition réservée titulaire/super_admin (RLS stricte, pas manage_documents). */
export function ChecklistTemplateFormSheet({ visible, onClose, onSaved }: ChecklistTemplateFormSheetProps) {
  const theme = useAppTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([newItem()]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TemplateFormValues>({ resolver: zodResolver(templateSchema), defaultValues: { name: '', category: 'other' }, values: visible ? { name: '', category: 'other' } : undefined });

  function handleClose() {
    setSubmitError(null);
    setItems([newItem()]);
    onClose();
  }

  function updateItemLabel(id: string, label: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, label } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  const onSubmit = handleSubmit(async (values) => {
    const validItems = items.filter((item) => item.label.trim()).map((item) => ({ ...item, label: item.label.trim() }));
    if (validItems.length === 0) {
      setSubmitError('Ajoute au moins un élément à cocher.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createChecklistTemplate({ name: values.name.trim(), category: values.category as ChecklistTemplateRow['category'], items: validItems });
      setItems([newItem()]);
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
      title="Nouveau modèle de check-list"
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Créer le modèle" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Controller control={control} name="name" render={({ field }) => <TextField label="Nom" required value={field.value} onChangeText={field.onChange} error={errors.name?.message} placeholder="Ouverture du cabinet..." />} />
      <Controller
        control={control}
        name="category"
        render={({ field }) => <ChipSelect label="Catégorie" options={CHECKLIST_CATEGORY_OPTIONS} value={field.value} onChange={field.onChange} />}
      />

      <View style={{ gap: spacing.sm }}>
        <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: theme.textSecondary }}>Éléments à cocher</Text>
        {items.map((item, index) => (
          <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <TextInput
              value={item.label}
              onChangeText={(text) => updateItemLabel(item.id, text)}
              placeholder={`Élément ${index + 1}`}
              placeholderTextColor={theme.textMuted}
              style={{
                flex: 1,
                borderWidth: 1.5,
                borderColor: theme.border,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                fontSize: typography.size.base,
                color: theme.textPrimary,
                backgroundColor: theme.surface,
                minHeight: 44,
              }}
            />
            {items.length > 1 ? (
              <Pressable onPress={() => removeItem(item.id)} accessibilityRole="button" accessibilityLabel="Retirer" hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={theme.textMuted} />
              </Pressable>
            ) : null}
          </View>
        ))}
        <Button label="Ajouter un élément" variant="outline" onPress={() => setItems((prev) => [...prev, newItem()])} />
      </View>
    </Sheet>
  );
}
