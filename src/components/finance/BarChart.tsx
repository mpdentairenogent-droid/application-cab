import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface BarChartRow {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartRow[];
  formatValue: (value: number) => string;
  emptyLabel?: string;
}

/** Graphique en barres minimal (§46 : "pas de graphiques décoratifs inutiles") — même langage visuel que ProgressBar. */
export function BarChart({ data, formatValue, emptyLabel = 'Aucune donnée' }: BarChartProps) {
  const theme = useAppTheme();

  if (data.length === 0) {
    return <Text style={{ fontSize: typography.size.sm, color: theme.textMuted, textAlign: 'center', paddingVertical: spacing.md }}>{emptyLabel}</Text>;
  }

  const max = Math.max(1, ...data.map((row) => row.value));

  return (
    <View style={styles.container}>
      {data.map((row, index) => (
        <View key={`${row.label}-${index}`} style={styles.row}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: theme.textPrimary }]} numberOfLines={1}>
              {row.label}
            </Text>
            <Text style={[styles.value, { color: theme.textSecondary }]}>{formatValue(row.value)}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: theme.neutralTint }]}>
            <View style={[styles.fill, { width: `${Math.max(2, (row.value / max) * 100)}%`, backgroundColor: row.color ?? theme.primary }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { gap: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, flexShrink: 1 },
  value: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
