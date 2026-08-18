import { StyleSheet, View } from 'react-native';

import type { StatusTone } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ProgressBarProps {
  /** 0..1 */
  progress: number;
  tone?: StatusTone;
  height?: number;
}

export function ProgressBar({ progress, tone = 'success', height = 8 }: ProgressBarProps) {
  const theme = useAppTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const fg = { success: theme.success, warning: theme.warning, danger: theme.danger, info: theme.info, neutral: theme.neutral }[tone];

  return (
    <View
      style={[styles.track, { backgroundColor: theme.neutralTint, height, borderRadius: height / 2 }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: fg, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
