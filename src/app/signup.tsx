import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { ChipSelect, Button, ScreenContainer } from '@/components/ui';
import { ROLE_LABELS } from '@/constants/permissions';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { AppRole } from '@/types/database';

// TODO(retirer avant publication) : sélecteur de rôle sur une inscription
// publique = n'importe qui peut se créer un compte owner_dentist/super_admin.
// Ajouté temporairement pour créer le premier compte admin sans passer par
// service_role. Voir aussi le TODO sur AuthProvider.signUp.
const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as AppRole[]).map((value) => ({ value, label: ROLE_LABELS[value] }));

export default function SignupScreen() {
  const theme = useAppTheme();
  const { signUp, isSigningIn } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [role, setRole] = useState<AppRole>('assistant');
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const canSubmit = !!firstName && !!lastName && !!email && password.length >= 8 && password === confirmation;

  const handleSubmit = async () => {
    setError(null);
    const { error: signUpError, needsEmailConfirmation: needsConfirmation } = await signUp(email.trim(), password, firstName.trim(), lastName.trim(), role);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    if (needsConfirmation) {
      setNeedsEmailConfirmation(true);
    }
    // Sinon (confirmation email désactivée côté projet), la session se crée
    // automatiquement et le routage vers (app) se fait tout seul via _layout.
  };

  if (needsEmailConfirmation) {
    return (
      <ScreenContainer edges={['top', 'bottom']} scroll={false} style={styles.container}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Vérifie ta boîte mail</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Un email de confirmation a été envoyé à {email.trim()}. Clique sur le lien qu&apos;il contient pour activer ton compte.
        </Text>
        <Button label="Retour à la connexion" variant="outline" onPress={() => router.replace('/login')} fullWidth />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll={false} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Créer un compte</Text>
        <Text style={[styles.devWarning, { color: theme.danger }]}>
          ⚠ Sélecteur de rôle temporaire (setup admin) — à retirer avant publication publique.
        </Text>

        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          autoComplete="given-name"
          placeholder="Prénom"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.surface }]}
        />
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          autoComplete="family-name"
          placeholder="Nom"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.surface }]}
        />
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
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder="Mot de passe (8 caractères min.)"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.surface }]}
        />
        <TextInput
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry
          autoComplete="new-password"
          placeholder="Confirme le mot de passe"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.surface }]}
          onSubmitEditing={handleSubmit}
        />

        <ChipSelect label="Rôle (temporaire, dev only)" options={ROLE_OPTIONS} value={role} onChange={setRole} />

        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

        <Button label="Créer mon compte" onPress={handleSubmit} loading={isSigningIn} disabled={!canSubmit} fullWidth />
        <Button label="Retour à la connexion" variant="outline" onPress={() => router.back()} fullWidth />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  flex: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold, textAlign: 'center' },
  description: { fontSize: typography.size.base, textAlign: 'center' },
  devWarning: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, textAlign: 'center' },
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
