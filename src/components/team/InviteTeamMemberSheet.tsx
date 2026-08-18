import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { Button, ChipSelect, Sheet, TextField } from '@/components/ui';
import { ROLE_LABELS } from '@/constants/permissions';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { inviteTeamMember, type InviteTeamMemberResult } from '@/services/team';
import type { AppRole } from '@/types/database';

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as AppRole[]).map((value) => ({ value, label: ROLE_LABELS[value] }));

const inviteSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est obligatoire'),
  lastName: z.string().min(1, 'Le nom est obligatoire'),
  email: z.string().min(1, "L'email est obligatoire").email('Email invalide'),
  role: z.enum(['assistant', 'collaborator_dentist', 'owner_dentist', 'admin_staff', 'accountant', 'super_admin']),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const DEFAULT_VALUES: InviteFormValues = { firstName: '', lastName: '', email: '', role: 'assistant' };

interface InviteTeamMemberSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/** §15 "créer utilisateur" en libre-service — voir services/team.ts:inviteTeamMember pour l'architecture (Edge Function, jamais de clé service_role côté client). */
export function InviteTeamMemberSheet({ visible, onClose, onCreated }: InviteTeamMemberSheetProps) {
  const theme = useAppTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteTeamMemberResult | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({ resolver: zodResolver(inviteSchema), defaultValues: DEFAULT_VALUES, values: visible ? DEFAULT_VALUES : undefined });

  function handleClose() {
    setSubmitError(null);
    setResult(null);
    reset(DEFAULT_VALUES);
    onClose();
  }

  function handleDone() {
    setResult(null);
    reset(DEFAULT_VALUES);
    onCreated();
  }

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const created = await inviteTeamMember(values);
      setResult(created);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  if (result) {
    return (
      <Sheet visible={visible} onClose={handleDone} title="Compte créé" footer={<Button label="Terminé" onPress={handleDone} fullWidth />}>
        <Text style={[styles.successText, { color: theme.textPrimary }]}>
          Le compte de {result.email} est prêt. Communique ces identifiants en direct (jamais par email ou SMS non chiffré) — la personne devra changer ce
          mot de passe dès sa première connexion via « Mot de passe oublié ».
        </Text>
        <View style={[styles.credentialBox, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Text style={[styles.credentialLabel, { color: theme.textMuted }]}>Email</Text>
          <Text style={[styles.credentialValue, { color: theme.textPrimary }]} selectable>
            {result.email}
          </Text>
          <Text style={[styles.credentialLabel, { color: theme.textMuted }]}>Mot de passe temporaire</Text>
          <Text style={[styles.credentialValue, { color: theme.textPrimary }]} selectable>
            {result.temporaryPassword}
          </Text>
        </View>
      </Sheet>
    );
  }

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="Inviter un membre"
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Créer le compte" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Controller control={control} name="firstName" render={({ field }) => <TextField label="Prénom" required value={field.value} onChangeText={field.onChange} error={errors.firstName?.message} />} />
      <Controller control={control} name="lastName" render={({ field }) => <TextField label="Nom" required value={field.value} onChangeText={field.onChange} error={errors.lastName?.message} />} />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            required
            value={field.value}
            onChangeText={field.onChange}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      />
      <Controller control={control} name="role" render={({ field }) => <ChipSelect label="Rôle" options={ROLE_OPTIONS} value={field.value} onChange={field.onChange} />} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  successText: { fontSize: typography.size.sm, lineHeight: 20 },
  credentialBox: { borderWidth: 1, borderRadius: 12, padding: spacing.md, gap: spacing.xs },
  credentialLabel: { fontSize: typography.size.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.xs },
  credentialValue: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
});
