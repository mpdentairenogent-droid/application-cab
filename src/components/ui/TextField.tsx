import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

import { FormField } from './FormField';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
}

export function TextField({ label, error, required, multiline, style, ...props }: TextFieldProps) {
  const theme = useAppTheme();
  return (
    <FormField label={label} error={error} required={required}>
      <TextInput
        placeholderTextColor={theme.textMuted}
        multiline={multiline}
        style={[
          styles.input,
          multiline ? styles.multiline : null,
          { borderColor: error ? theme.danger : theme.border, color: theme.textPrimary, backgroundColor: theme.surface },
          style,
        ]}
        {...props}
      />
    </FormField>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.size.base,
    minHeight: 52,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.md },
});
