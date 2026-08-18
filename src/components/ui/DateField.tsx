import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { toISODate } from '@/lib/format';

import { FormField } from './FormField';

interface DateFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  required?: boolean;
  clearable?: boolean;
}

export function DateField({ label, value, onChange, error, required, clearable }: DateFieldProps) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);

  return (
    <FormField label={label} error={error} required={required}>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: error ? theme.danger : theme.border, backgroundColor: theme.surface }]}>
        <Ionicons name="calendar-outline" size={18} color={theme.textMuted} />
        <Text style={[styles.text, { color: value ? theme.textPrimary : theme.textMuted }]}>
          {value ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value)) : 'Choisir une date'}
        </Text>
        {clearable && value ? (
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </Pressable>

      {open ? (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, selected) => {
            setOpen(Platform.OS === 'ios');
            if (event.type === 'dismissed') {
              setOpen(false);
              return;
            }
            if (selected) onChange(toISODate(selected));
            if (Platform.OS === 'android') setOpen(false);
          }}
        />
      ) : null}
    </FormField>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  text: { fontSize: typography.size.base, flex: 1 },
});
