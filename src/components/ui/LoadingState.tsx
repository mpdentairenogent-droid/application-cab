import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

import { Button } from './Button';

export function LoadingState({ label = 'Chargement...' }: { label?: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.primary} />
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/** État d'erreur compréhensible pour un utilisateur non technique (§62). */
export function ErrorState({ title = 'Une erreur est survenue', description, onRetry }: ErrorStateProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      {description ? <Text style={[styles.label, { color: theme.textMuted }]}>{description}</Text> : null}
      {onRetry ? <Button label="Réessayer" variant="outline" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl4, gap: spacing.md },
  title: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, textAlign: 'center' },
  label: { fontSize: typography.size.sm, textAlign: 'center', maxWidth: 280 },
});
