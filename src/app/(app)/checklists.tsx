import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { ChecklistCompletionSheet } from '@/components/checklists/ChecklistCompletionSheet';
import { ChecklistTemplateFormSheet } from '@/components/checklists/ChecklistTemplateFormSheet';
import { Badge, Card, ChipSelect, EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { CHECKLIST_CATEGORY_LABEL } from '@/constants/organizationLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDateTime } from '@/lib/format';
import { listActiveChecklistTemplates, listAllChecklistTemplates, listRecentChecklistEntries } from '@/services/checklists';
import type { ChecklistTemplateRow } from '@/types/database';

type ChecklistsView = 'modeles' | 'historique';

export default function ChecklistsScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  // RLS restreint la gestion des modèles au rôle titulaire/super_admin
  // directement (my_role() in (...)), pas à une permission accordable —
  // reflète donc le rôle ici plutôt qu'un can(PERMISSIONS...).
  const canManageTemplates = profile?.role === 'owner_dentist' || profile?.role === 'super_admin';
  const queryClient = useQueryClient();

  const [view, setView] = useState<ChecklistsView>('modeles');
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [completingTemplate, setCompletingTemplate] = useState<ChecklistTemplateRow | undefined>(undefined);

  const templatesQuery = useQuery({ queryKey: ['checklist-templates-active'], queryFn: listActiveChecklistTemplates, enabled: view === 'modeles' });
  const allTemplatesQuery = useQuery({ queryKey: ['checklist-templates-all'], queryFn: listAllChecklistTemplates, enabled: view === 'historique' });
  const entriesQuery = useQuery({ queryKey: ['checklist-entries-recent'], queryFn: () => listRecentChecklistEntries(), enabled: view === 'historique' });

  const templateNameById = new Map((allTemplatesQuery.data ?? []).map((t) => [t.id, t.name]));

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['checklist-templates-active'] });
    queryClient.invalidateQueries({ queryKey: ['checklist-templates-all'] });
    queryClient.invalidateQueries({ queryKey: ['checklist-entries-recent'] });
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Check-lists</Text>
        {view === 'modeles' && canManageTemplates ? (
          <Pressable onPress={() => setTemplateFormOpen(true)} accessibilityRole="button" accessibilityLabel="Nouveau modèle" style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={24} color={theme.textOnPrimary} />
          </Pressable>
        ) : null}
      </View>

      <ChipSelect
        label="Vue"
        options={[
          { value: 'modeles' as const, label: 'Modèles' },
          { value: 'historique' as const, label: 'Historique' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'modeles' ? (
        templatesQuery.isLoading ? (
          <LoadingState />
        ) : templatesQuery.data?.length === 0 ? (
          <EmptyState title="Aucun modèle de check-list" description={canManageTemplates ? 'Crée le premier modèle avec le bouton +.' : undefined} />
        ) : (
          <View style={styles.list}>
            {templatesQuery.data?.map((template) => (
              <Pressable key={template.id} onPress={() => setCompletingTemplate(template)}>
                <Card style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {template.name}
                    </Text>
                    <Text style={[styles.itemHint, { color: theme.textMuted }]}>{template.items.length} élément(s)</Text>
                  </View>
                  {template.category ? <Badge label={CHECKLIST_CATEGORY_LABEL[template.category]} tone="neutral" /> : null}
                </Card>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      {view === 'historique' ? (
        entriesQuery.isLoading ? (
          <LoadingState />
        ) : entriesQuery.data?.length === 0 ? (
          <EmptyState title="Aucun remplissage enregistré" />
        ) : (
          <View style={styles.list}>
            {entriesQuery.data?.map((entry) => {
              const doneCount = entry.completed_items.filter((i) => i.checked).length;
              return (
                <Card key={entry.id} style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {templateNameById.get(entry.template_id) ?? 'Check-list'}
                    </Text>
                    <Text style={[styles.itemHint, { color: theme.textMuted }]}>
                      {formatDateTime(entry.performed_at)} · {doneCount}/{entry.completed_items.length}
                    </Text>
                    {entry.anomalies ? <Text style={[styles.anomaly, { color: theme.danger }]}>{entry.anomalies}</Text> : null}
                  </View>
                  {entry.anomalies ? <Badge label="Anomalie" tone="danger" /> : <Badge label="OK" tone="success" />}
                </Card>
              );
            })}
          </View>
        )
      ) : null}

      <ChecklistTemplateFormSheet
        visible={templateFormOpen}
        onClose={() => setTemplateFormOpen(false)}
        onSaved={() => {
          setTemplateFormOpen(false);
          invalidateAll();
        }}
      />

      <ChecklistCompletionSheet
        visible={!!completingTemplate}
        onClose={() => setCompletingTemplate(undefined)}
        template={completingTemplate}
        onSaved={() => {
          setCompletingTemplate(undefined);
          invalidateAll();
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  itemTitle: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  itemHint: { fontSize: typography.size.xs },
  anomaly: { fontSize: typography.size.xs, marginTop: 2 },
});
