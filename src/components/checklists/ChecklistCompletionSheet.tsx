import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Button, Sheet, TextField } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { buildCompletedItems, createChecklistEntry } from '@/services/checklists';
import type { ChecklistTemplateRow } from '@/types/database';

interface ChecklistCompletionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  template?: ChecklistTemplateRow;
}

/** §41 : remplissage rapide — cocher les éléments, signaler une anomalie si besoin. */
export function ChecklistCompletionSheet({ visible, onClose, onSaved, template }: ChecklistCompletionSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [anomalies, setAnomalies] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!template) return null;

  function toggle(itemId: string) {
    setChecked((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }

  function handleClose() {
    setChecked({});
    setAnomalies('');
    setSubmitError(null);
    onClose();
  }

  async function handleSubmit() {
    if (!profile || !template) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createChecklistEntry({
        template_id: template.id,
        completed_by: profile.id,
        completed_items: buildCompletedItems(template.items, checked),
        anomalies: anomalies.trim() || null,
      });
      setChecked({});
      setAnomalies('');
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const checkedCount = template.items.filter((item) => checked[item.id]).length;

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title={template.name}
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label={`Valider (${checkedCount}/${template.items.length})`} onPress={handleSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <View style={{ gap: spacing.xs }}>
        {template.items.map((item) => {
          const isChecked = !!checked[item.id];
          return (
            <Pressable
              key={item.id}
              onPress={() => toggle(item.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm }}>
              <Ionicons name={isChecked ? 'checkbox' : 'square-outline'} size={24} color={isChecked ? theme.success : theme.textMuted} />
              <Text style={{ flex: 1, fontSize: typography.size.base, color: theme.textPrimary, textDecorationLine: isChecked ? 'line-through' : 'none' }}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextField label="Anomalies (optionnel)" multiline value={anomalies} onChangeText={setAnomalies} placeholder="Signaler un problème rencontré..." />
    </Sheet>
  );
}
