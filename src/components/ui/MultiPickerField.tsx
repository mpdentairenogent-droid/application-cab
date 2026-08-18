import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

import { FormField } from './FormField';
import type { PickerOption } from './PickerField';
import { Sheet } from './Sheet';

interface MultiPickerFieldProps {
  label: string;
  placeholder?: string;
  options: PickerOption[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  required?: boolean;
}

/** Comme PickerField, mais sélection multiple (ex. assigner une tâche à plusieurs personnes, §25). */
export function MultiPickerField({ label, placeholder = 'Sélectionner...', options, value, onChange, error, required }: MultiPickerFieldProps) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabels = options.filter((o) => value.includes(o.value)).map((o) => o.label);
  const filtered = useMemo(
    () => (query.trim() ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase())) : options),
    [options, query]
  );

  function toggle(optionValue: string) {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);
  }

  return (
    <FormField label={label} error={error} required={required}>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: error ? theme.danger : theme.border, backgroundColor: theme.surface }]}>
        <Text style={[styles.triggerText, { color: selectedLabels.length ? theme.textPrimary : theme.textMuted }]} numberOfLines={1}>
          {selectedLabels.length ? selectedLabels.join(', ') : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
      </Pressable>

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        footer={<Text style={[styles.count, { color: theme.textMuted }]}>{value.length} sélectionné(s)</Text>}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher..."
          placeholderTextColor={theme.textMuted}
          style={[styles.search, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.surface }]}
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.value}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const checked = value.includes(item.value);
            return (
              <Pressable onPress={() => toggle(item.value)} style={[styles.option, checked ? { backgroundColor: theme.primaryTint } : null]}>
                <Ionicons
                  name={checked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={checked ? theme.primary : theme.textMuted}
                  style={styles.checkbox}
                />
                <View style={styles.flex1}>
                  <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>{item.label}</Text>
                  {item.description ? <Text style={[styles.optionDescription, { color: theme.textMuted }]}>{item.description}</Text> : null}
                </View>
              </Pressable>
            );
          }}
        />
      </Sheet>
    </FormField>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  triggerText: { fontSize: typography.size.base, flex: 1 },
  search: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.size.base,
    marginBottom: spacing.sm,
  },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radius.sm, gap: spacing.sm },
  checkbox: { marginTop: 2 },
  flex1: { flex: 1 },
  optionLabel: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  optionDescription: { fontSize: typography.size.xs, marginTop: 2 },
  count: { fontSize: typography.size.sm, textAlign: 'center' },
});
