import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { CategoryPickerField } from '@/components/stock/CategoryPickerField';
import { Button, DateField, PhotoPickerField, Sheet, TextField } from '@/components/ui';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { findClosestMatch } from '@/lib/duplicateDetection';
import { getErrorMessage } from '@/lib/errors';
import { resolvePhotoUrl } from '@/lib/storage';
import { createStockItem, updateStockItem } from '@/services/stock';
import { listStockCategories } from '@/services/stockCategories';
import type { StockItemRow } from '@/types/database';

const stockItemSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  categoryId: z.string().nullable(),
  reference: z.string(),
  quantity: z.string(),
  unit: z.string().min(1, "L'unité est obligatoire"),
  minimumQuantity: z.string(),
  location: z.string(),
  unitPrice: z.string(),
  expiryDate: z.string().nullable(),
  photoUrl: z.string().nullable(),
});

type StockItemFormValues = z.infer<typeof stockItemSchema>;

interface StockItemFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  item?: StockItemRow;
  existingItems?: StockItemRow[];
}

function defaultsFor(item?: StockItemRow): StockItemFormValues {
  if (!item) return { name: '', categoryId: null, reference: '', quantity: '0', unit: 'unité', minimumQuantity: '0', location: '', unitPrice: '', expiryDate: null, photoUrl: null };
  return {
    name: item.name,
    categoryId: item.category_id,
    reference: item.reference ?? '',
    quantity: String(item.quantity),
    unit: item.unit,
    minimumQuantity: String(item.minimum_quantity),
    location: item.location ?? '',
    unitPrice: item.unit_price != null ? String(item.unit_price) : '',
    expiryDate: item.expiry_date,
    photoUrl: item.photo_url,
  };
}

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function StockItemFormSheet({ visible, onClose, onSaved, item, existingItems }: StockItemFormSheetProps) {
  const theme = useAppTheme();
  const isEditing = !!item;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const categoriesQuery = useQuery({ queryKey: ['stock-categories'], queryFn: listStockCategories, enabled: visible });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StockItemFormValues>({ resolver: zodResolver(stockItemSchema), defaultValues: defaultsFor(item), values: visible ? defaultsFor(item) : undefined });

  const nameValue = useWatch({ control, name: 'name' });
  // Uniquement à la création : en édition, l'article comparerait avec
  // lui-même. Purement informatif, ne bloque jamais la saisie — un article
  // de taille/référence différente peut légitimement ressembler à un autre.
  const duplicateMatch = useMemo(() => {
    if (isEditing || !existingItems || nameValue.trim().length < 2) return null;
    return findClosestMatch(nameValue, existingItems, (i) => i.name);
  }, [isEditing, existingItems, nameValue]);

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const photoUrl = await resolvePhotoUrl('stock-items', values.photoUrl);
      const payload = {
        name: values.name.trim(),
        category_id: values.categoryId,
        reference: values.reference.trim() || null,
        unit: values.unit.trim(),
        minimum_quantity: toNumber(values.minimumQuantity),
        location: values.location.trim() || null,
        unit_price: values.unitPrice.trim() ? toNumber(values.unitPrice) : null,
        expiry_date: values.expiryDate,
        photo_url: photoUrl,
      };
      if (isEditing) {
        await updateStockItem(item.id, payload);
      } else {
        await createStockItem({ ...payload, quantity: toNumber(values.quantity) });
      }
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
      onClose={onClose}
      title={isEditing ? "Modifier l'article" : 'Nouvel article'}
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label={isEditing ? 'Enregistrer' : "Créer l'article"} onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Controller control={control} name="name" render={({ field }) => <TextField label="Nom" required value={field.value} onChangeText={field.onChange} error={errors.name?.message} />} />
      {duplicateMatch ? (
        <Text style={{ fontSize: typography.size.xs, color: theme.warning, marginTop: -12 }}>
          {duplicateMatch.exact ? `Un article "${duplicateMatch.item.name}" existe déjà.` : `Ressemble à "${duplicateMatch.item.name}", déjà en stock.`}
        </Text>
      ) : null}
      <Controller control={control} name="photoUrl" render={({ field }) => <PhotoPickerField label="Photo (optionnel)" value={field.value} onChange={field.onChange} />} />
      <Controller
        control={control}
        name="categoryId"
        render={({ field }) => <CategoryPickerField label="Catégorie" categories={categoriesQuery.data ?? []} value={field.value} onChange={field.onChange} />}
      />
      <Controller control={control} name="reference" render={({ field }) => <TextField label="Référence" value={field.value} onChangeText={field.onChange} />} />
      {!isEditing ? (
        <Controller
          control={control}
          name="quantity"
          render={({ field }) => <TextField label="Quantité initiale" keyboardType="numeric" value={field.value} onChangeText={field.onChange} />}
        />
      ) : null}
      <Controller control={control} name="unit" render={({ field }) => <TextField label="Unité" required value={field.value} onChangeText={field.onChange} error={errors.unit?.message} placeholder="boîte, unité, paquet..." />} />
      <Controller
        control={control}
        name="minimumQuantity"
        render={({ field }) => <TextField label="Seuil minimum (alerte stock faible)" keyboardType="numeric" value={field.value} onChangeText={field.onChange} />}
      />
      <Controller control={control} name="location" render={({ field }) => <TextField label="Emplacement" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="unitPrice" render={({ field }) => <TextField label="Prix unitaire (€)" keyboardType="numeric" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="expiryDate" render={({ field }) => <DateField label="Date de péremption (optionnel)" value={field.value} onChange={field.onChange} clearable />} />
    </Sheet>
  );
}