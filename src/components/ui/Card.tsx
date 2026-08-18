import { StyleSheet, View, type ViewProps } from 'react-native';

import { radius, shadow, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface CardProps extends ViewProps {
  padded?: boolean;
  elevated?: boolean;
}

export function Card({ style, padded = true, elevated = true, ...props }: CardProps) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: theme.surface, borderColor: theme.border },
        padded && styles.padded,
        elevated ? shadow.sm : null,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  padded: { padding: spacing.lg },
});
