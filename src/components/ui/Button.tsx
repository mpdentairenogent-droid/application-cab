import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

// Hauteurs mini 40/52pt : au-dessus des seuils tactiles recommandés
// iOS (44pt) et Android (48dp) pour les boutons importants (§5).
export function Button({ label, variant = 'primary', size = 'lg', loading, fullWidth, icon, disabled, ...props }: ButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;

  const backgrounds: Record<Variant, string> = {
    primary: theme.primary,
    secondary: theme.secondaryTint,
    outline: 'transparent',
    ghost: 'transparent',
    danger: theme.danger,
  };
  const textColors: Record<Variant, string> = {
    primary: theme.textOnPrimary,
    secondary: theme.secondary,
    outline: theme.textPrimary,
    ghost: theme.primary,
    danger: theme.textOnPrimary,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: backgrounds[variant] },
        variant === 'outline' ? { borderWidth: 1.5, borderColor: theme.border } : null,
        fullWidth ? styles.fullWidth : null,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: textColors[variant] }, size === 'lg' ? styles.labelLg : null]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  md: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 40 },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: 52 },
  fullWidth: { width: '100%' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  labelLg: { fontSize: typography.size.lg },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
