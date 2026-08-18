import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      {icon}
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: theme.textMuted }]}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl4, gap: spacing.sm },
  title: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, textAlign: 'center' },
  description: { fontSize: typography.size.sm, textAlign: 'center', maxWidth: 280 },
});
