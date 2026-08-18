import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

import { FormField } from './FormField';
import { Sheet } from './Sheet';

export interface PickerOption {
  value: string;
  label: string;
  description?: string;
}

interface PickerFieldProps {
  label: string;
  placeholder?: string;
  options: PickerOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  required?: boolean;
  clearable?: boolean;
}

/** Champ "sélectionner dans une liste" (praticien, fournisseur, personne...) — ouvre une feuille avec recherche. */
export function PickerField({ label, placeholder = 'Sélectionner...', options, value, onChange, error, required, clearable }: PickerFieldProps) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(
    () => (query.trim() ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase())) : options),
    [options, query]
  );

  return (
    <FormField label={label} error={error} required={required}>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: error ? theme.danger : theme.border, backgroundColor: theme.surface }]}>
        <Text style={[styles.triggerText, { color: selected ? theme.textPrimary : theme.textMuted }]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher..."
          placeholderTextColor={theme.textMuted}
          style={[styles.search, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.surface }]}
        />
        {clearable && value ? (
          <Pressable
            onPress={() => {
              onChange(null);
              setOpen(false);
            }}
            style={styles.option}>
            <Text style={[styles.optionLabel, { color: theme.danger }]}>Effacer la sélection</Text>
          </Pressable>
        ) : null}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.value}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onChange(item.value);
                setOpen(false);
                setQuery('');
              }}
              style={[styles.option, item.value === value ? { backgroundColor: theme.primaryTint } : null]}>
              <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>{item.label}</Text>
              {item.description ? <Text style={[styles.optionDescription, { color: theme.textMuted }]}>{item.description}</Text> : null}
            </Pressable>
          )}
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
  search: { borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.size.base, marginBottom: spacing.sm },
  option: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radius.sm },
  optionLabel: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  optionDescription: { fontSize: typography.size.xs, marginTop: 2 },
});
