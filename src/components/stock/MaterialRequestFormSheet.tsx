import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { AutocompleteField, Button, ChipSelect, Divider, Sheet, TextField } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { URGENCY_OPTIONS } from '@/constants/stockLabels';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createMaterialRequest } from '@/services/materialRequests';
import { listAllStockItems } from '@/services/stock';

const itemSchema = z.object({
  productName: z.string().min(1, 'Le produit est obligatoire'),
  quantity: z.string().min(1, 'Quantité requise'),
});

const requestSchema = z.object({
  items: z.array(itemSchema).min(1),
  urgency: z.enum(['low', 'normal', 'high', 'urgent']),
  comment: z.string(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

function emptyDefaults(): RequestFormValues {
  return { items: [{ productName: '', quantity: '1' }], urgency: 'normal', comment: '' };
}

interface MaterialRequestFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** §28, §56 : une demande en moins de 15 secondes, mais avec autant d'articles que nécessaire — suggestions depuis le stock existant. */
export function MaterialRequestFormSheet({ visible, onClose, onSaved }: MaterialRequestFormSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const stockQuery = useQuery({ queryKey: ['stock-items-all'], queryFn: listAllStockItems, enabled: visible });
  const productSuggestions = [...new Set((stockQuery.data ?? []).map((item) => item.name))];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestFormValues>({ resolver: zodResolver(requestSchema), defaultValues: emptyDefaults() });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) return;
    const items = values.items.map((item) => ({ productName: item.productName.trim(), quantity: Number.parseInt(item.quantity, 10) }));
    if (items.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createMaterialRequest({ urgency: values.urgency, comment: values.comment.trim() || null, requested_by: profile.id }, items);
      reset(emptyDefaults());
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
      title="Demande de matériel"
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Envoyer la demande" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      {fields.map((field, index) => (
        <View key={field.id} style={styles.itemRow}>
          {index > 0 ? <Divider /> : null}
          <View style={styles.itemHeader}>
            <Text style={[styles.itemLabel, { color: theme.textSecondary }]}>Article {index + 1}</Text>
            {fields.length > 1 ? (
              <Pressable onPress={() => remove(index)} accessibilityRole="button" accessibilityLabel="Retirer cet article" hitSlop={8}>
                <Ionicons name="close-circle-outline" size={20} color={theme.danger} />
              </Pressable>
            ) : null}
          </View>
          <Controller
            control={control}
            name={`items.${index}.productName`}
            render={({ field: f }) => (
              <AutocompleteField
                label="Produit"
                required
                value={f.value}
                onChangeText={f.onChange}
                suggestions={productSuggestions}
                error={errors.items?.[index]?.productName?.message}
                placeholder="Ex. Gants nitrile taille S"
                autoFocus={index === 0}
              />
            )}
          />
          <Controller
            control={control}
            name={`items.${index}.quantity`}
            render={({ field: f }) => (
              <TextField
                label="Quantité"
                required
                keyboardType="number-pad"
                value={f.value}
                onChangeText={f.onChange}
                error={errors.items?.[index]?.quantity?.message}
              />
            )}
          />
        </View>
      ))}

      <Button label="+ Ajouter un article" variant="ghost" onPress={() => append({ productName: '', quantity: '1' })} />

      <Divider />

      <Controller control={control} name="urgency" render={({ field }) => <ChipSelect label="Urgence" options={URGENCY_OPTIONS} value={field.value} onChange={field.onChange} />} />
      <Controller control={control} name="comment" render={({ field }) => <TextField label="Commentaire (optionnel)" multiline value={field.value} onChangeText={field.onChange} />} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  itemRow: { gap: spacing.md },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
});
