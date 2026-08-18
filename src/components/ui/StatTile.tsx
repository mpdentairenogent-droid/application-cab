import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, type StatusTone } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

import { Card } from './Card';

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  tone?: StatusTone;
}

export function StatTile({ label, value, hint, tone }: StatTileProps) {
  const theme = useAppTheme();
  const accent = tone
    ? { success: theme.success, warning: theme.warning, danger: theme.danger, info: theme.info, neutral: theme.neutral }[tone]
    : theme.primary;

  return (
    <Card style={styles.card}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <Text style={[styles.label, { color: theme.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.value, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? (
        <Text style={[styles.hint, { color: theme.textMuted }]} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140, gap: spacing.xs, overflow: 'hidden' },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  value: { fontSize: typography.size.xl3, fontWeight: typography.weight.bold },
  hint: { fontSize: typography.size.xs },
});
