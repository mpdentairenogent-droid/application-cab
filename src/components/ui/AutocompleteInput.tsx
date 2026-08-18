import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface AutocompleteInputProps {
  value: string;
  onChangeText: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  autoFocus?: boolean;
  keyboardType?: KeyboardTypeOptions;
  hasError?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

/**
 * Cœur du champ autocomplete (texte libre + suggestions filtrées à la
 * frappe), sans label — utilisé tel quel dans une rangée compacte (ex.
 * "ajouter un article" de OrderDetailSheet), et enveloppé d'un [[FormField]]
 * par [[AutocompleteField]] pour un formulaire classique.
 */
export function AutocompleteInput({ value, onChangeText, suggestions, placeholder, autoFocus, keyboardType, hasError, containerStyle, inputStyle }: AutocompleteInputProps) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];
    return suggestions.filter((s) => s.toLowerCase().includes(query) && s.toLowerCase() !== query).slice(0, 5);
  }, [value, suggestions]);

  const showDropdown = focused && matches.length > 0;

  return (
    <View style={containerStyle}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        // Délai avant fermeture : laisse le temps au onPress d'une suggestion de se déclencher avant que le blur ne démonte le menu.
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        style={[styles.input, { borderColor: hasError ? theme.danger : theme.border, color: theme.textPrimary, backgroundColor: theme.surface }, inputStyle]}
      />
      {showDropdown ? (
        // Empilées dans le flux normal (pas position: absolute) : un recouvrement en
        // overlay avec la zone suivante du formulaire vole ses appuis sur le web
        // (l'élément natif <input> derrière gagne le clic malgré le zIndex).
        <View style={[styles.dropdown, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          {matches.map((match) => (
            <Pressable
              key={match}
              onPress={() => {
                onChangeText(match);
                setFocused(false);
              }}
              style={styles.option}>
              <Text style={[styles.optionLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                {match}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: typography.size.base, minHeight: 52 },
  dropdown: { borderWidth: 1.5, borderRadius: radius.md, overflow: 'hidden' },
  option: { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  optionLabel: { fontSize: typography.size.base },
});
