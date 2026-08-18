import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { Button, Sheet, TextField } from '@/components/ui';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createDocumentCategory } from '@/services/documents';

const categorySchema = z.object({ name: z.string().min(1, 'Le nom est obligatoire') });
type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function CategoryFormSheet({ visible, onClose, onSaved }: CategoryFormSheetProps) {
  const theme = useAppTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema), defaultValues: { name: '' }, values: visible ? { name: '' } : undefined });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createDocumentCategory({ name: values.name.trim() });
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
      title="Nouvelle catégorie"
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Créer" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField label="Nom" required value={field.value} onChangeText={field.onChange} error={errors.name?.message} placeholder="Protocoles, fiches techniques..." />
        )}
      />
    </Sheet>
  );
}
