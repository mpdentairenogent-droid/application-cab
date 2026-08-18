// @react-native-community/datetimepicker n'a pas d'implémentation web —
// variante Platform-specific (résolue automatiquement par le bundler sur
// web) utilisant l'input date natif du navigateur plutôt que de planter au
// bundling. La cible principale reste mobile (§5) ; le web sert surtout à
// l'administratif/desktop (§80), un input HTML standard y est acceptable.
import { createElement } from 'react';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

import { FormField } from './FormField';

interface DateFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  required?: boolean;
  clearable?: boolean;
}

export function DateField({ label, value, onChange, error, required }: DateFieldProps) {
  const theme = useAppTheme();

  return (
    <FormField label={label} error={error} required={required}>
      {createElement('input', {
        type: 'date',
        value: value ?? '',
        onChange: (e: { target: { value: string } }) => onChange(e.target.value || null),
        style: {
          ...styles,
          borderColor: error ? theme.danger : theme.border,
          color: theme.textPrimary,
          backgroundColor: theme.surface,
        },
      })}
    </FormField>
  );
}

const styles: Record<string, string | number> = {
  borderWidth: 1.5,
  borderRadius: radius.md,
  paddingLeft: spacing.md,
  paddingRight: spacing.md,
  height: 52,
  fontSize: typography.size.base,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};
