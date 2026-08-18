import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ChipSelect, Sheet, TextField } from '@/components/ui';
import { MOVEMENT_TYPE_OPTIONS } from '@/constants/stockLabels';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { recordStockMovement } from '@/services/stock';
import type { StockItemRow, StockMovementRow } from '@/types/database';

const movementSchema = z.object({
  movementType: z.enum(['in', 'out', 'correction', 'order_reception', 'loss', 'expired']),
  quantity: z.string().min(1, 'Quantité requise'),
  reason: z.string(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

const emptyDefaults: MovementFormValues = { movementType: 'out', quantity: '1', reason: '' };

interface StockMovementFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  item?: StockItemRow;
}

export function StockMovementFormSheet({ visible, onClose, onSaved, item }: StockMovementFormSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MovementFormValues>({ resolver: zodResolver(movementSchema), defaultValues: emptyDefaults, values: visible ? emptyDefaults : undefined });

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!profile || !item) return;
    const quantity = Number.parseFloat(values.quantity.replace(',', '.'));
    if (!Number.isFinite(quantity) || (values.movementType !== 'correction' && quantity <= 0)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await recordStockMovement({
        stockItemId: item.id,
        movementType: values.movementType as StockMovementRow['movement_type'],
        quantity,
        reason: values.reason.trim() || null,
        userId: profile.id,
      });
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
      title={item ? `Mouvement — ${item.name}` : 'Mouvement de stock'}
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Enregistrer" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Controller
        control={control}
        name="movementType"
        render={({ field }) => <ChipSelect label="Type" options={MOVEMENT_TYPE_OPTIONS} value={field.value} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="quantity"
        render={({ field }) => (
          <TextField
            label="Quantité"
            required
            keyboardType="decimal-pad"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.quantity?.message}
          />
        )}
      />
      <Controller control={control} name="reason" render={({ field }) => <TextField label="Motif (optionnel)" value={field.value} onChangeText={field.onChange} />} />
    </Sheet>
  );
}