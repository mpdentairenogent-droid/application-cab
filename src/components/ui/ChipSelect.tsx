import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

import { FormField } from './FormField';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipSelectProps<T extends string> {
  label: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
  required?: boolean;
}

/** Sélection d'une valeur d'énum (priorité, statut, urgence...) — plus rapide au pouce qu'un menu déroulant (§5, §56). */
export function ChipSelect<T extends string>({ label, options, value, onChange, error, required }: ChipSelectProps<T>) {
  const theme = useAppTheme();
  return (
    <FormField label={label} error={error} required={required}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primaryTint : theme.surface },
              ]}>
              <Text style={[styles.label, { color: selected ? theme.primary : theme.textSecondary }]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </FormField>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingRight: spacing.lg },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1.5, minHeight: 40, justifyContent: 'center' },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
});
