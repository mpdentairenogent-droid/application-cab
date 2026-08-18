import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, type StatusTone } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface BadgeProps {
  label: string;
  tone?: StatusTone;
}

/** Couleurs fonctionnelles (§6) : vert=conforme, orange=attention, rouge=urgence, bleu=info, gris=archivé. */
export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const theme = useAppTheme();
  const colors: Record<StatusTone, { bg: string; fg: string }> = {
    success: { bg: theme.successTint, fg: theme.success },
    warning: { bg: theme.warningTint, fg: theme.warning },
    danger: { bg: theme.dangerTint, fg: theme.danger },
    info: { bg: theme.infoTint, fg: theme.info },
    neutral: { bg: theme.neutralTint, fg: theme.neutral },
  };
  const { bg, fg } = colors[tone];

  return (
    <View style={[styles.base, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, alignSelf: 'flex-start' },
  label: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
});
