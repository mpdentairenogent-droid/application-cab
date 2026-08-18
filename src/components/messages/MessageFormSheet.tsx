import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ChipSelect, PickerField, Sheet, TextField } from '@/components/ui';
import { ROLE_LABELS } from '@/constants/permissions';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createInternalMessage } from '@/services/internalMessages';
import type { AppRole } from '@/types/database';

const AUDIENCE_OPTIONS = [
  { value: 'team' as const, label: "Toute l'équipe" },
  { value: 'role' as const, label: 'Un rôle' },
];
const roleOptions = (Object.keys(ROLE_LABELS) as AppRole[]).map((value) => ({ value, label: ROLE_LABELS[value] }));

const messageSchema = z.object({
  title: z.string().min(1, 'Le titre est obligatoire'),
  body: z.string().min(1, 'Le message est obligatoire'),
  audienceType: z.enum(['team', 'role']),
  audienceRole: z.string().nullable(),
  requiresAcknowledgement: z.boolean(),
});

type MessageFormValues = z.infer<typeof messageSchema>;

interface MessageFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function MessageFormSheet({ visible, onClose, onSaved }: MessageFormSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { title: '', body: '', audienceType: 'team', audienceRole: null, requiresAcknowledgement: false },
  });

  const audienceType = watch('audienceType');

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createInternalMessage({
        title: values.title.trim(),
        body: values.body.trim(),
        author_id: profile.id,
        audience_type: values.audienceType,
        audience_role: values.audienceType === 'role' ? (values.audienceRole as AppRole | null) : null,
        requires_acknowledgement: values.requiresAcknowledgement,
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
      title="Nouvelle annonce"
      footer={
        <>
          {submitError ? <Text style={[styles.error, { color: theme.danger }]}>{submitError}</Text> : null}
          <Button label="Publier" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Controller
        control={control}
        name="title"
        render={({ field }) => <TextField label="Titre" required value={field.value} onChangeText={field.onChange} error={errors.title?.message} />}
      />
      <Controller
        control={control}
        name="body"
        render={({ field }) => (
          <TextField label="Message" required multiline value={field.value} onChangeText={field.onChange} error={errors.body?.message} />
        )}
      />
      <Controller
        control={control}
        name="audienceType"
        render={({ field }) => <ChipSelect label="Destinataires" options={AUDIENCE_OPTIONS} value={field.value} onChange={field.onChange} />}
      />
      {audienceType === 'role' ? (
        <Controller
          control={control}
          name="audienceRole"
          render={({ field }) => <PickerField label="Rôle" options={roleOptions} value={field.value} onChange={field.onChange} placeholder="Choisir un rôle" />}
        />
      ) : null}
      <Controller
        control={control}
        name="requiresAcknowledgement"
        render={({ field }) => (
          <Pressable onPress={() => field.onChange(!field.value)} style={styles.checkRow}>
            <Ionicons name={field.value ? 'checkbox' : 'square-outline'} size={20} color={field.value ? theme.primary : theme.textMuted} />
            <Text style={[styles.checkLabel, { color: theme.textPrimary }]}>Demander une confirmation de lecture</Text>
          </Pressable>
        )}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  error: { fontSize: typography.size.sm, textAlign: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  checkLabel: { fontSize: typography.size.base, fontWeight: typography.weight.medium, flex: 1 },
});