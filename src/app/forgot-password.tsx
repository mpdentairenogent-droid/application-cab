import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ScreenContainer } from '@/components/ui';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setStatus('sending');
    setError(null);
    const { error: resetError } = await requestPasswordReset(email.trim());
    if (resetError) {
      setError(resetError);
      setStatus('idle');
    } else {
      setStatus('sent');
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll={false} style={styles.container}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Mot de passe oublié</Text>

      {status === 'sent' ? (
        <>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Si un compte existe pour {email.trim()}, un email avec un lien de réinitialisation vient d&apos;être envoyé.
          </Text>
          <Button label="Retour à la connexion" variant="outline" onPress={() => router.back()} fullWidth />
        </>
      ) : (
        <>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Indique ton email professionnel, tu recevras un lien pour choisir un nouveau mot de passe.
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="prenom@cabinet.fr"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.surface }]}
          />
          {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
          <Button label="Envoyer le lien" onPress={handleSubmit} loading={status === 'sending'} disabled={!email} fullWidth />
        </>
      )}
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
