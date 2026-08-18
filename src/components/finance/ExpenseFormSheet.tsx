import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { Button, ChipSelect, DateField, PhotoPickerField, PickerField, Sheet, TextField } from '@/components/ui';
import { EXPENSE_CATEGORY_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/constants/financeLabels';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { toISODate } from '@/lib/format';
import { resolvePhotoUrl } from '@/lib/storage';
import { createExpense, deleteExpense, updateExpense } from '@/services/expenses';
import { listSuppliers } from '@/services/suppliers';
import type { ExpenseRow } from '@/types/database';

const expenseSchema = z.object({
  expenseDate: z.string(),
  amount: z.string().min(1, 'Montant requis'),
  category: z.enum(['consumables', 'equipment', 'laboratory', 'staff', 'maintenance', 'it', 'rent', 'insurance', 'subscription', 'other']),
  supplierId: z.string().nullable(),
  paymentMethod: z.string(),
  comment: z.string(),
  photoUrl: z.string().nullable(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

/** `prefill` : brouillon suggéré par le scan IA d'une facture (voir ScanReceiptSheet) — jamais utilisé si `expense` (édition) est fourni. */
function defaultsFor(expense?: ExpenseRow, prefill?: Partial<ExpenseFormValues>): ExpenseFormValues {
  if (expense) {
    return {
      expenseDate: expense.expense_date,
      amount: String(expense.amount),
      category: expense.category,
      supplierId: expense.supplier_id,
      paymentMethod: expense.payment_method ?? '',
      comment: expense.comment ?? '',
      photoUrl: expense.photo_url,
    };
  }
  return { expenseDate: toISODate(new Date()), amount: '', category: 'other', supplierId: null, paymentMethod: '', comment: '', photoUrl: null, ...prefill };
}

interface ExpenseFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  expense?: ExpenseRow;
  prefill?: Partial<ExpenseFormValues>;
}

export function ExpenseFormSheet({ visible, onClose, onSaved, expense, prefill }: ExpenseFormSheetProps) {
  const theme = useAppTheme();
  const isEditing = !!expense;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: listSuppliers, enabled: visible });
  const supplierOptions = (suppliersQuery.data ?? []).map((s) => ({ value: s.id, label: s.name }));

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: defaultsFor(expense, prefill),
    values: visible ? defaultsFor(expense, prefill) : undefined,
  });

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const amount = Number.parseFloat(values.amount.replace(',', '.'));
      const photoUrl = await resolvePhotoUrl('expenses', values.photoUrl);
      const payload = {
        expense_date: values.expenseDate,
        amount: Number.isFinite(amount) ? amount : 0,
        category: values.category,
        supplier_id: values.supplierId,
        payment_method: values.paymentMethod.trim() || null,
        comment: values.comment.trim() || null,
        photo_url: photoUrl,
      };
      if (isEditing) {
        await updateExpense(expense.id, payload);
      } else {
        await createExpense(payload);
      }
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handleDelete() {
    if (!expense) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await deleteExpense(expense.id);
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
      title={isEditing ? 'Modifier la dépense' : 'Nouvelle dépense'}
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Enregistrer" onPress={onSubmit} loading={isSubmitting} fullWidth />
          {isEditing ? <Button label="Supprimer" variant="ghost" onPress={handleDelete} loading={isSubmitting} /> : null}
        </>
      }>
      <Controller control={control} name="expenseDate" render={({ field }) => <DateField label="Date" value={field.value} onChange={field.onChange} />} />
      <Controller
        control={control}
        name="amount"
        render={({ field }) => <TextField label="Montant (€)" required keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} error={errors.amount?.message} />}
      />
      <Controller
        control={control}
        name="category"
        render={({ field }) => <ChipSelect label="Catégorie" options={EXPENSE_CATEGORY_OPTIONS} value={field.value} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="supplierId"
        render={({ field }) => <PickerField label="Fournisseur (optionnel)" options={supplierOptions} value={field.value} onChange={field.onChange} clearable />}
      />
      <Controller
        control={control}
        name="paymentMethod"
        render={({ field }) => <ChipSelect label="Moyen de paiement" options={PAYMENT_METHOD_OPTIONS} value={field.value} onChange={field.onChange} />}
      />
      <Controller control={control} name="comment" render={({ field }) => <TextField label="Commentaire (optionnel)" multiline value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="photoUrl" render={({ field }) => <PhotoPickerField label="Justificatif (optionnel)" value={field.value} onChange={field.onChange} />} />
    </Sheet>
  );
}