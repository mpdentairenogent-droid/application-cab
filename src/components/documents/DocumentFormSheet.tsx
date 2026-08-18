import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ChipSelect, PickerField, Sheet, TextField } from '@/components/ui';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createDocument, listDocumentCategories } from '@/services/documents';

const documentSchema = z.object({
  title: z.string().min(1, 'Le titre est obligatoire'),
  categoryId: z.string().nullable(),
  filePath: z.string().min(1, 'Le lien ou la référence est obligatoire'),
  fileType: z.string(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

const emptyDefaults: DocumentFormValues = { title: '', categoryId: null, filePath: '', fileType: 'pdf' };

interface DocumentFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** §48 : bibliothèque de documents/protocoles. file_path est un lien externe ou une référence texte — l'upload natif (photo/PDF) est prévu en Phase 6 avec le reste des pièces jointes (§55), pour rester cohérent avec le choix fait sur les autres modules. */
export function DocumentFormSheet({ visible, onClose, onSaved }: DocumentFormSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const categoriesQuery = useQuery({ queryKey: ['document-categories'], queryFn: listDocumentCategories, enabled: visible });
  const categoryOptions = (categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentFormValues>({ resolver: zodResolver(documentSchema), defaultValues: emptyDefaults, values: visible ? emptyDefaults : undefined });

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createDocument({
        title: values.title.trim(),
        category_id: values.categoryId,
        file_path: values.filePath.trim(),
        file_type: values.fileType || null,
        uploaded_by: profile.id,
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
      title="Nouveau document"
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Ajouter" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Controller control={control} name="title" render={({ field }) => <TextField label="Titre" required value={field.value} onChangeText={field.onChange} error={errors.title?.message} />} />
      <Controller
        control={control}
        name="categoryId"
        render={({ field }) => <PickerField label="Catégorie" options={categoryOptions} value={field.value} onChange={field.onChange} clearable />}
      />
      <Controller
        control={control}
        name="fileType"
        render={({ field }) => (
          <ChipSelect
            label="Type"
            options={[
              { value: 'pdf', label: 'PDF' },
              { value: 'image', label: 'Image' },
              { value: 'link', label: 'Lien' },
              { value: 'other', label: 'Autre' },
            ]}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="filePath"
        render={({ field }) => (
          <TextField
            label="Lien ou référence"
            required
            autoCapitalize="none"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.filePath?.message}
            placeholder="https://... ou emplacement du document"
          />
        )}
      />
    </Sheet>
  );
}
