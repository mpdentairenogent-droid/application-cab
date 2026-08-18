import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { CategoryFormSheet } from '@/components/documents/CategoryFormSheet';
import { DocumentFormSheet } from '@/components/documents/DocumentFormSheet';
import { LaboratoryFormSheet } from '@/components/documents/LaboratoryFormSheet';
import { Badge, Card, ChipSelect, EmptyState, LoadingState, ScreenContainer, TextField } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePermissions } from '@/permissions/usePermissions';
import { listDocumentCategories, listDocuments, setDocumentFavorite } from '@/services/documents';
import { listLaboratories } from '@/services/laboratories';
import type { LaboratoryRow } from '@/types/database';

type DocumentsView = 'documents' | 'laboratoires';

export default function DocumentsScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const { can } = usePermissions();
  const canManageDocuments = can(PERMISSIONS.MANAGE_DOCUMENTS);
  const queryClient = useQueryClient();

  const [view, setView] = useState<DocumentsView>('documents');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [documentFormOpen, setDocumentFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [laboratoryFormOpen, setLaboratoryFormOpen] = useState(false);
  const [editingLaboratory, setEditingLaboratory] = useState<LaboratoryRow | undefined>(undefined);

  const documentsQuery = useQuery({ queryKey: ['documents', profile?.id], queryFn: () => listDocuments(profile!.id), enabled: view === 'documents' && !!profile });
  const categoriesQuery = useQuery({ queryKey: ['document-categories'], queryFn: listDocumentCategories, enabled: view === 'documents' });
  const laboratoriesQuery = useQuery({ queryKey: ['laboratories'], queryFn: listLaboratories, enabled: view === 'laboratoires' });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['document-categories'] });
    queryClient.invalidateQueries({ queryKey: ['laboratories'] });
  }

  async function toggleFavorite(documentId: string, isFavorite: boolean) {
    if (!profile) return;
    await setDocumentFavorite(documentId, profile.id, !isFavorite);
    queryClient.invalidateQueries({ queryKey: ['documents'] });
  }

  const categoryChipOptions = [{ value: '', label: 'Toutes' }, ...(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))];
  const filteredDocuments = (documentsQuery.data ?? []).filter((doc) => {
    if (categoryFilter && doc.category_id !== categoryFilter) return false;
    if (search.trim() && !doc.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Documents</Text>
        {view === 'documents' && canManageDocuments ? (
          <View style={styles.headerActions}>
            <Pressable onPress={() => setCategoryFormOpen(true)} accessibilityRole="button" accessibilityLabel="Nouvelle catégorie" style={[styles.addButton, styles.secondaryButton, { borderColor: theme.border }]}>
              <Ionicons name="pricetag-outline" size={20} color={theme.textSecondary} />
            </Pressable>
            <Pressable onPress={() => setDocumentFormOpen(true)} accessibilityRole="button" accessibilityLabel="Nouveau document" style={[styles.addButton, { backgroundColor: theme.primary }]}>
              <Ionicons name="add" size={24} color={theme.textOnPrimary} />
            </Pressable>
          </View>
        ) : null}
        {view === 'laboratoires' && canManageDocuments ? (
          <Pressable
            onPress={() => {
              setEditingLaboratory(undefined);
              setLaboratoryFormOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Nouveau laboratoire"
            style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={24} color={theme.textOnPrimary} />
          </Pressable>
        ) : null}
      </View>

      <ChipSelect
        label="Vue"
        options={[
          { value: 'documents' as const, label: 'Documents' },
          { value: 'laboratoires' as const, label: 'Laboratoires' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'documents' ? (
        <>
          <TextField label="Rechercher" placeholder="Titre du document..." value={search} onChangeText={setSearch} />
          <ChipSelect label="Catégorie" options={categoryChipOptions} value={categoryFilter ?? ''} onChange={(v) => setCategoryFilter(v || null)} />

          {documentsQuery.isLoading ? (
            <LoadingState />
          ) : filteredDocuments.length === 0 ? (
            <EmptyState title="Aucun document" />
          ) : (
            <View style={styles.list}>
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} style={styles.row}>
                  <Pressable style={styles.flex1} onPress={() => Linking.openURL(doc.file_path).catch(() => {})}>
                    <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {doc.title}
                    </Text>
                    {doc.file_type ? (
                      <Text style={[styles.itemHint, { color: theme.textMuted }]} numberOfLines={1}>
                        {doc.file_type.toUpperCase()}
                      </Text>
                    ) : null}
                  </Pressable>
                  <Pressable onPress={() => toggleFavorite(doc.id, doc.isFavorite)} accessibilityRole="button" accessibilityLabel="Favori" hitSlop={8}>
                    <Ionicons name={doc.isFavorite ? 'star' : 'star-outline'} size={20} color={doc.isFavorite ? theme.warning : theme.textMuted} />
                  </Pressable>
                </Card>
              ))}
            </View>
          )}
        </>
      ) : null}

      {view === 'laboratoires' ? (
        laboratoriesQuery.isLoading ? (
          <LoadingState />
        ) : laboratoriesQuery.data?.length === 0 ? (
          <EmptyState title="Aucun laboratoire" />
        ) : (
          <View style={styles.list}>
            {laboratoriesQuery.data?.map((lab) => (
              <Pressable
                key={lab.id}
                onPress={() => {
                  if (!canManageDocuments) return;
                  setEditingLaboratory(lab);
                  setLaboratoryFormOpen(true);
                }}>
                <Card style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {lab.name}
                    </Text>
                    {lab.specialties ? (
                      <Text style={[styles.itemHint, { color: theme.textMuted }]} numberOfLines={1}>
                        {lab.specialties}
                      </Text>
                    ) : null}
                  </View>
                  {lab.phone ? <Badge label={lab.phone} tone="neutral" /> : null}
                </Card>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      <DocumentFormSheet
        visible={documentFormOpen}
        onClose={() => setDocumentFormOpen(false)}
        onSaved={() => {
          setDocumentFormOpen(false);
          invalidateAll();
        }}
      />

      <CategoryFormSheet
        visible={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        onSaved={() => {
          setCategoryFormOpen(false);
          invalidateAll();
        }}
      />

      <LaboratoryFormSheet
        visible={laboratoryFormOpen}
        onClose={() => setLaboratoryFormOpen(false)}
        onSaved={() => {
          setLaboratoryFormOpen(false);
          invalidateAll();
        }}
        laboratory={editingLaboratory}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { borderWidth: 1.5 },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  itemTitle: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  itemHint: { fontSize: typography.size.xs },
});
