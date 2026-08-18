import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ChipSelect, PickerField, Sheet, TextField } from '@/components/ui';
import { ROLE_LABELS } from '@/constants/permissions';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createPostIt, deletePostIt, updatePostIt } from '@/services/postIts';
import { listActiveTeamMembers } from '@/services/team';
import type { AppRole, PostItRow } from '@/types/database';

const POST_IT_COLORS = ['#FDE9C8', '#F8D7DA', '#FFF3CD', '#D4EDDA', '#D1ECF1', '#E2D5F1'];
const PRIORITY_OPTIONS = [
  { value: 'low' as const, label: 'Basse' },
  { value: 'normal' as const, label: 'Normale' },
  { value: 'high' as const, label: 'Haute' },
];
const RECIPIENT_OPTIONS = [
  { value: 'team' as const, label: "Toute l'équipe" },
  { value: 'role' as const, label: 'Un rôle' },
  { value: 'user' as const, label: 'Une personne' },
];
const roleOptions = (Object.keys(ROLE_LABELS) as AppRole[]).map((value) => ({ value, label: ROLE_LABELS[value] }));

const postItSchema = z.object({
  title: z.string(),
  body: z.string().min(1, 'Le texte est obligatoire'),
  color: z.string(),
  priority: z.enum(['low', 'normal', 'high']),
  pinned: z.boolean(),
  recipientType: z.enum(['team', 'role', 'user']),
  recipientRole: z.string().nullable(),
  recipientUserId: z.string().nullable(),
});

type PostItFormValues = z.infer<typeof postItSchema>;

interface PostItFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  postIt?: PostItRow;
}

function defaultsFor(postIt?: PostItRow): PostItFormValues {
  if (!postIt) {
    return { title: '', body: '', color: POST_IT_COLORS[0], priority: 'normal', pinned: false, recipientType: 'team', recipientRole: null, recipientUserId: null };
  }
  return {
    title: postIt.title ?? '',
    body: postIt.body,
    color: postIt.color,
    priority: postIt.priority,
    pinned: postIt.pinned,
    recipientType: postIt.recipient_type === 'user' ? 'user' : postIt.recipient_type === 'role' ? 'role' : 'team',
    recipientRole: postIt.recipient_role,
    recipientUserId: postIt.recipient_user_id,
  };
}

export function PostItFormSheet({ visible, onClose, onSaved, postIt }: PostItFormSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const isEditing = !!postIt;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const teamQuery = useQuery({ queryKey: ['team-members'], queryFn: listActiveTeamMembers, enabled: visible });
  const teamOptions = (teamQuery.data ?? []).map((m) => ({ value: m.id, label: `${m.first_name} ${m.last_name}` }));

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PostItFormValues>({ resolver: zodResolver(postItSchema), defaultValues: defaultsFor(postIt) });

  useEffect(() => {
    if (visible) {
      reset(defaultsFor(postIt));
      setConfirmingDelete(false);
      setSubmitError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, postIt?.id]);

  const recipientType = watch('recipientType');

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        title: values.title.trim() || null,
        body: values.body.trim(),
        color: values.color,
        priority: values.priority,
        pinned: values.pinned,
        recipient_type: values.recipientType,
        recipient_role: values.recipientType === 'role' ? (values.recipientRole as AppRole | null) : null,
        recipient_user_id: values.recipientType === 'user' ? values.recipientUserId : null,
      };
      if (isEditing) {
        await updatePostIt(postIt.id, payload);
      } else {
        await createPostIt({ ...payload, author_id: profile.id });
      }
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handleDelete() {
    if (!postIt) return;
    setIsSubmitting(true);
    try {
      await deletePostIt(postIt.id);
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Modifier le Post-it' : 'Nouveau Post-it'}
      footer={
        confirmingDelete ? (
          <View style={styles.confirmRow}>
            <Button label="Annuler" variant="outline" onPress={() => setConfirmingDelete(false)} />
            <Button label="Supprimer" variant="danger" onPress={handleDelete} loading={isSubmitting} />
          </View>
        ) : (
          <View style={styles.footerColumn}>
            {submitError ? <Text style={[styles.error, { color: theme.danger }]}>{submitError}</Text> : null}
            <Button label={isEditing ? 'Enregistrer' : 'Créer le Post-it'} onPress={onSubmit} loading={isSubmitting} fullWidth />
            {isEditing ? <Button label="Supprimer" variant="ghost" onPress={() => setConfirmingDelete(true)} /> : null}
          </View>
        )
      }>
      <Controller
        control={control}
        name="body"
        render={({ field }) => (
          <TextField label="Message" required multiline value={field.value} onChangeText={field.onChange} error={errors.body?.message} placeholder="Ex. Ne pas utiliser autoclave 2" />
        )}
      />

      <Controller control={control} name="title" render={({ field }) => <TextField label="Titre (optionnel)" value={field.value} onChangeText={field.onChange} />} />

      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <View style={styles.colorSection}>
            <Text style={[styles.colorLabel, { color: theme.textSecondary }]}>Couleur</Text>
            <View style={styles.colorRow}>
              {POST_IT_COLORS.map((color) => (
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

      <Controller control={control} name="priority" render={({ field }) => <ChipSelect label="Priorité" options={PRIORITY_OPTIONS} value={field.value} onChange={field.onChange} />} />

      <Controller
        control={control}
        name="pinned"
        render={({ field }) => (
          <Pressable onPress={() => field.onChange(!field.value)} style={styles.pinRow}>
            <Ionicons name={field.value ? 'bookmark' : 'bookmark-outline'} size={20} color={field.value ? theme.primary : theme.textMuted} />
            <Text style={[styles.pinLabel, { color: theme.textPrimary }]}>Épingler ce Post-it</Text>
          </Pressable>
        )}
      />

      <Controller
        control={control}
        name="recipientType"
        render={({ field }) => <ChipSelect label="Destinataire" options={RECIPIENT_OPTIONS} value={field.value} onChange={field.onChange} />}
      />

      {recipientType === 'role' ? (
        <Controller
          control={control}
          name="recipientRole"
          render={({ field }) => <PickerField label="Rôle" options={roleOptions} value={field.value} onChange={field.onChange} placeholder="Choisir un rôle" />}
        />
      ) : null}

      {recipientType === 'user' ? (
        <Controller
          control={control}
          name="recipientUserId"
          render={({ field }) => <PickerField label="Personne" options={teamOptions} value={field.value} onChange={field.onChange} placeholder="Choisir une personne" />}
        />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  footerColumn: { gap: spacing.sm },
  confirmRow: { flexDirection: 'row', gap: spacing.sm },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
  colorSection: { gap: spacing.xs },
  colorLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  colorRow: { flexDirection: 'row', gap: spacing.sm },
  swatch: { width: 36, height: 36, borderRadius: radius.md },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  pinLabel: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
});