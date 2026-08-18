import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { SupplierFormSheet } from '@/components/suppliers/SupplierFormSheet';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { listSuppliers } from '@/services/suppliers';
import type { SupplierRow } from '@/types/database';

export default function SuppliersScreen() {
  const theme = useAppTheme();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierRow | undefined>(undefined);
  const queryClient = useQueryClient();

  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: listSuppliers });

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(supplier: SupplierRow) {
    setEditing(supplier);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Fournisseurs</Text>
        <Pressable onPress={openCreate} accessibilityRole="button" accessibilityLabel="Nouveau fournisseur" style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={24} color={theme.textOnPrimary} />
        </Pressable>
      </View>

      {suppliersQuery.isLoading ? (
        <LoadingState />
      ) : suppliersQuery.data?.length === 0 ? (
        <EmptyState title="Aucun fournisseur" />
      ) : (
        <View style={styles.list}>
          {suppliersQuery.data?.map((supplier) => (
            <Pressable key={supplier.id} onPress={() => openEdit(supplier)}>
              <Card style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {supplier.name}
                  </Text>
                  {supplier.category || supplier.phone ? (
                    <Text style={[styles.itemHint, { color: theme.textMuted }]} numberOfLines={1}>
                      {[supplier.category, supplier.phone].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      <SupplierFormSheet visible={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSaved} supplier={editing} />
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
});
