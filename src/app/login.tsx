import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ScreenContainer } from '@/components/ui';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function LoginScreen() {
  const theme = useAppTheme();
  const { signIn, isSigningIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) setError(signInError);
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll={false} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <View style={[styles.logoPlaceholder, { backgroundColor: theme.primaryTint }]}>
            <Text style={[styles.logoInitial, { color: theme.primary }]}>C</Text>
          </View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Cabinet Dentaire</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Connexion à l&apos;espace interne</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
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
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.surface }]}
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

          <Button label="Se connecter" onPress={handleSubmit} loading={isSigningIn} disabled={!email || !password} fullWidth />

          <Link href="/forgot-password" style={[styles.forgotLink, { color: theme.secondary }]}>
            Mot de passe oublié ?
          </Link>
          <Link href="/signup" style={[styles.forgotLink, { color: theme.secondary }]}>
            Créer un compte
          </Link>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  flex: { flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl4, gap: spacing.sm },
  logoPlaceholder: { width: 64, height: 64, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  logoInitial: { fontSize: typography.size.xl3, fontWeight: typography.weight.bold },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  subtitle: { fontSize: typography.size.base },
  form: { gap: spacing.lg },
  field: { gap: spacing.xs },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.size.base,
    minHeight: 52,
  },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
  forgotLink: { textAlign: 'center', fontSize: typography.size.sm, fontWeight: typography.weight.medium, marginTop: spacing.sm },
});
