import { Ionicons } from '@expo/vector-icons';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { PostItFormSheet } from '@/components/postIts/PostItFormSheet';
import { PostItListItem } from '@/components/dashboards/PostItListItem';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { listAllPostIts } from '@/services/postIts';
import type { PostItRow } from '@/types/database';

export default function PostItsScreen() {
  const theme = useAppTheme();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PostItRow | undefined>(undefined);
  const queryClient = useQueryClient();

  const postItsQuery = useQuery({ queryKey: ['all-post-its'], queryFn: listAllPostIts });

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(postIt: PostItRow) {
    setEditing(postIt);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    queryClient.invalidateQueries({ queryKey: ['all-post-its'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-pinned-post-its'] });
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Post-it</Text>
        <Pressable onPress={openCreate} accessibilityRole="button" accessibilityLabel="Nouveau Post-it" style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={24} color={theme.textOnPrimary} />
        </Pressable>
      </View>

      {postItsQuery.isLoading ? (
        <LoadingState />
      ) : postItsQuery.data?.length === 0 ? (
        <EmptyState title="Aucun Post-it" description="Crée le premier avec le bouton +." />
      ) : (
        <View style={styles.grid}>
          {postItsQuery.data?.map((postIt) => (
            <Pressable key={postIt.id} onPress={() => openEdit(postIt)} style={styles.gridItem}>
              <PostItListItem postIt={postIt} />
            </Pressable>
          ))}
        </View>
      )}

      <PostItFormSheet visible={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSaved} postIt={editing} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridItem: { width: '47%' },
});
