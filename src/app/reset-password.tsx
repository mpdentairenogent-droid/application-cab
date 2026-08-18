import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ScreenContainer } from '@/components/ui';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ResetPasswordScreen() {
  const theme = useAppTheme();
  const { confirmPasswordReset, clearPasswordRecovery, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = password.length >= 8 && password === confirmation;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    const { error: resetError } = await confirmPasswordReset(password);
    setIsSubmitting(false);
    if (resetError) {
      setError(resetError);
      return;
    }
    // Repart sur une connexion normale plutôt que de laisser la session de
    // récupération se prolonger implicitement en session standard.
    await signOut();
    clearPasswordRecovery();
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll={false} style={styles.container}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Nouveau mot de passe</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>Choisis un mot de passe d&apos;au moins 8 caractères.</Text>

      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Nouveau mot de passe"
        placeholderTextColor={theme.textMuted}
        style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.surface }]}
      />
      <TextInput
        value={confirmation}
        onChangeText={setConfirmation}
        secureTextEntry
        placeholder="Confirme le mot de passe"
        placeholderTextColor={theme.textMuted}
        style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.surface }]}
      />

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

      <Button label="Valider" onPress={handleSubmit} loading={isSubmitting} disabled={!canSubmit} fullWidth />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', gap: spacing.lg },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold, textAlign: 'center' },
  description: { fontSize: typography.size.base, textAlign: 'center' },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.size.base,
    minHeight: 52,
  },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
});
