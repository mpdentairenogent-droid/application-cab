import type { KeyboardTypeOptions } from 'react-native';

import { AutocompleteInput } from './AutocompleteInput';
import { FormField } from './FormField';

interface AutocompleteFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suggestions: string[];
  error?: string;
  required?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  keyboardType?: KeyboardTypeOptions;
}

/**
 * Texte libre avec suggestions filtrées à la frappe (ex. articles déjà au
 * stock) — reste éditable pour un produit pas encore référencé, contrairement
 * à [[PickerField]] qui impose une valeur de la liste. Version avec label
 * pour un formulaire classique ; voir [[AutocompleteInput]] pour la version
 * nue (rangée compacte).
 */
export function AutocompleteField({ label, value, onChangeText, suggestions, error, required, placeholder, autoFocus, keyboardType }: AutocompleteFieldProps) {
  return (
    <FormField label={label} error={error} required={required}>
      <AutocompleteInput
        value={value}
        onChangeText={onChangeText}
        suggestions={suggestions}
        placeholder={placeholder}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        hasError={!!error}
      />
    </FormField>
  );
}
