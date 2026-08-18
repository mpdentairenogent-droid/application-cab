import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

import { FormField } from './FormField';

interface PhotoPickerFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * Photo optionnelle (article de stock, étiquette de contrôle...). `value`
 * peut être une URL déjà uploadée ou une URI locale fraîchement choisie —
 * l'upload réel n'a lieu qu'à l'enregistrement du formulaire, voir
 * [[resolvePhotoUrl]].
 */
export function PhotoPickerField({ label, value, onChange }: PhotoPickerFieldProps) {
  const theme = useAppTheme();
  const [error, setError] = useState<string | null>(null);

  async function handleCamera() {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Autorisation caméra refusée.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
  }

  async function handleLibrary() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Autorisation galerie refusée.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
  }

  return (
    <FormField label={label} error={error ?? undefined}>
      {value ? (
        <View style={styles.previewRow}>
          <Image source={{ uri: value }} style={[styles.thumbnail, { borderColor: theme.border }]} />
          <Pressable
            onPress={() => onChange(null)}
            accessibilityRole="button"
            accessibilityLabel="Retirer la photo"
            style={[styles.removeButton, { borderColor: theme.border }]}>
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
            <Text style={[styles.removeLabel, { color: theme.danger }]}>Retirer</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.actionsRow}>
        <Pressable onPress={handleCamera} style={[styles.actionButton, { borderColor: theme.border }]} accessibilityRole="button" accessibilityLabel="Prendre une photo">
          <Ionicons name="camera-outline" size={18} color={theme.textSecondary} />
          <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Prendre une photo</Text>
        </Pressable>
        <Pressable onPress={handleLibrary} style={[styles.actionButton, { borderColor: theme.border }]} accessibilityRole="button" accessibilityLabel="Choisir une image">
          <Ionicons name="images-outline" size={18} color={theme.textSecondary} />
          <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Choisir une image</Text>
        </Pressable>
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumbnail: { width: 72, height: 72, borderRadius: radius.md, borderWidth: 1 },
  removeButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  removeLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderWidth: 1.5, borderRadius: radius.md, paddingVertical: spacing.md },
  actionLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
});
