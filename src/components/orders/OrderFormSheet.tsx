import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { Button, DateField, PickerField, Sheet, TextField } from '@/components/ui';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createOrder } from '@/services/orders';
import { listSuppliers } from '@/services/suppliers';

const orderSchema = z.object({
  supplierId: z.string().nullable(),
  orderNumber: z.string(),
  expectedDeliveryDate: z.string().nullable(),
  notes: z.string(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function OrderFormSheet({ visible, onClose, onSaved }: OrderFormSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: listSuppliers, enabled: visible });
  const supplierOptions = (suppliersQuery.data ?? []).map((s) => ({ value: s.id, label: s.name }));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { supplierId: null, orderNumber: '', expectedDeliveryDate: null, notes: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createOrder({
        supplier_id: values.supplierId,
        order_number: values.orderNumber.trim() || null,
        expected_delivery_date: values.expectedDeliveryDate,
        notes: values.notes.trim() || null,
        ordered_by: profile.id,
      });
      reset();
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
      title="Nouvelle commande"
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Créer la commande" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Controller
        control={control}
        name="supplierId"
        render={({ field }) => <PickerField label="Fournisseur" options={supplierOptions} value={field.value} onChange={field.onChange} clearable placeholder="Choisir un fournisseur" />}
      />
      <Controller control={control} name="orderNumber" render={({ field }) => <TextField label="Numéro de commande" value={field.value} onChangeText={field.onChange} />} />
      <Controller
        control={control}
        name="expectedDeliveryDate"
        render={({ field }) => <DateField label="Livraison prévue" value={field.value} onChange={field.onChange} clearable />}
      />
      <Controller control={control} name="notes" render={({ field }) => <TextField label="Notes" multiline value={field.value} onChangeText={field.onChange} />} />
      {errors.supplierId ? <Text style={{ color: theme.danger }}>{errors.supplierId.message}</Text> : null}
    </Sheet>
  );
}