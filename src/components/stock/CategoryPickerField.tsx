import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, FormField, Sheet } from '@/components/ui';
import { CATEGORY_COLORS } from '@/constants/categoryColors';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createStockCategory } from '@/services/stockCategories';
import type { StockCategoryRow } from '@/types/database';

interface CategoryPickerFieldProps {
  label: string;
  categories: StockCategoryRow[];
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * Champ "catégorie" pour un article de stock : ouvre une feuille listant les
 * catégories existantes (point coloré + nom) avec une création à la volée
 * repliée DANS la même feuille (pas une deuxième Modal) — voir la note sur
 * Sheet.tsx : deux `Modal` RN visibles en même temps cassent la saisie sur
 * Expo web, et ce champ est déjà imbriqué dans le Sheet du formulaire
 * parent (StockItemFormSheet), donc pas question d'en ouvrir un troisième.
 */
export function CategoryPickerField({ label, categories, value, onChange }: CategoryPickerFieldProps) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(CATEGORY_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selected = categories.find((c) => c.id === value);

  function closeSheet() {
    setOpen(false);
    setCreating(false);
    setNewName('');
    setNewColor(CATEGORY_COLORS[0]);
    setCreateError(null);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setIsSubmitting(true);
    setCreateError(null);
    try {
      const created = await createStockCategory({ name: newName.trim(), color: newColor });
      queryClient.invalidateQueries({ queryKey: ['stock-categories'] });
      onChange(created.id);
      closeSheet();
    } catch (error) {
      setCreateError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormField label={label}>
      <Pressable onPress={() => setOpen(true)} style={[styles.trigger, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        {selected ? (
          <View style={styles.selectedRow}>
            <View style={[styles.dot, { backgroundColor: selected.color }]} />
            <Text style={[styles.triggerText, { color: theme.textPrimary }]} numberOfLines={1}>
              {selected.name}
            </Text>
          </View>
        ) : (
          <Text style={[styles.triggerText, { color: theme.textMuted }]}>Aucune catégorie</Text>
        )}
        <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
      </Pressable>

      <Sheet visible={open} onClose={closeSheet} title={creating ? 'Nouvelle catégorie' : label}>
        {creating ? (
          <View style={styles.createForm}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Nom de la catégorie"
              placeholderTextColor={theme.textMuted}
              autoFocus
              style={[styles.createInput, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.surface }]}
            />
            <View style={styles.colorRow}>
              {CATEGORY_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setNewColor(color)}
                  accessibilityRole="button"
                  accessibilityLabel={`Couleur ${color}`}
                  style={[styles.swatch, { backgroundColor: color }, newColor === color ? { borderColor: theme.textPrimary, borderWidth: 3 } : null]}
                />
              ))}
            </View>
            {createError ? <Text style={[styles.error, { color: theme.danger }]}>{createError}</Text> : null}
            <Button label="Créer la catégorie" onPress={handleCreate} loading={isSubmitting} fullWidth />
            <Button label="Annuler" variant="ghost" onPress={() => setCreating(false)} />
          </View>
        ) : (
          <>
            {value ? (
              <Pressable
                onPress={() => {
                  onChange(null);
                  closeSheet();
                }}
                style={styles.option}>
                <Text style={[styles.optionLabel, { color: theme.danger }]}>Aucune catégorie</Text>
              </Pressable>
            ) : null}
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => {
                  onChange(cat.id);
                  closeSheet();
                }}
                style={[styles.option, cat.id === value ? { backgroundColor: theme.primaryTint } : null]}>
                <View style={[styles.dot, { backgroundColor: cat.color }]} />
                <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>{cat.name}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setCreating(true)} style={styles.newOption}>
              <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
              <Text style={[styles.newOptionLabel, { color: theme.primary }]}>Nouvelle catégorie</Text>
            </Pressable>
          </>
        )}
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
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  triggerText: { fontSize: typography.size.base, flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radius.sm },
  optionLabel: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  newOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  newOptionLabel: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  createForm: { gap: spacing.md },
  createInput: { borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: typography.size.base, minHeight: 52 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: 36, height: 36, borderRadius: radius.full },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
});
