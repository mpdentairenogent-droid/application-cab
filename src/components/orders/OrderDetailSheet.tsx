import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AutocompleteInput, Button, ChipSelect, Sheet } from '@/components/ui';
import { ORDER_STATUS_OPTIONS } from '@/constants/orderLabels';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { addOrderItem, deleteOrder, deleteOrderItem, listOrderItems, updateOrder } from '@/services/orders';
import type { OrderWithSupplier } from '@/services/orders';
import { listAllStockItems } from '@/services/stock';
import { listStockCategories } from '@/services/stockCategories';

interface OrderDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  order?: OrderWithSupplier;
}

export function OrderDetailSheet({ visible, onClose, onSaved, order }: OrderDetailSheetProps) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const itemsQuery = useQuery({
    queryKey: ['order-items', order?.id],
    queryFn: () => listOrderItems(order!.id),
    enabled: visible && !!order,
  });
  const stockQuery = useQuery({ queryKey: ['stock-items-all'], queryFn: listAllStockItems, enabled: visible });
  const categoriesQuery = useQuery({ queryKey: ['stock-categories'], queryFn: listStockCategories, enabled: visible });
  const productSuggestions = [...new Set((stockQuery.data ?? []).map((item) => item.name))];
  // Parcours par catégorie (§56 : rapidité, favoris, auto-complétion) — un
  // complément à la saisie libre ci-dessous, pas un remplacement : ne montre
  // les articles du stock que lorsqu'une catégorie est choisie, pour éviter
  // de déverser tout le catalogue avant que l'utilisateur ait filtré quoi
  // que ce soit.
  const filteredStockItems = selectedCategoryId ? (stockQuery.data ?? []).filter((item) => item.category_id === selectedCategoryId) : [];

  if (!order) return null;

  async function handleStatusChange(status: (typeof ORDER_STATUS_OPTIONS)[number]['value']) {
    setError(null);
    try {
      await updateOrder(order!.id, { status });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  }

  async function handleAddItem() {
    if (!newItemName.trim()) return;
    const quantity = Number.parseInt(newItemQuantity, 10) || 1;
    try {
      await addOrderItem({ order_id: order!.id, product_name: newItemName.trim(), quantity });
      setNewItemName('');
      setNewItemQuantity('1');
      queryClient.invalidateQueries({ queryKey: ['order-items', order!.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  }

  async function handleRemoveItem(itemId: string) {
    try {
      await deleteOrderItem(itemId);
      queryClient.invalidateQueries({ queryKey: ['order-items', order!.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  }

  async function handleDelete() {
    try {
      await deleteOrder(order!.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={order.order_number || order.supplierName || 'Commande'}
      footer={
        confirmingDelete ? (
          <View style={styles.confirmRow}>
            <Button label="Annuler" variant="outline" onPress={() => setConfirmingDelete(false)} />
            <Button label="Supprimer" variant="danger" onPress={handleDelete} />
          </View>
        ) : (
          <Button label="Supprimer la commande" variant="ghost" onPress={() => setConfirmingDelete(true)} />
        )
      }>
      {order.supplierName ? (
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Fournisseur</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>{order.supplierName}</Text>
        </View>
      ) : null}

      <ChipSelect label="Statut" options={ORDER_STATUS_OPTIONS} value={order.status} onChange={handleStatusChange} />

      <View>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Articles</Text>
        {itemsQuery.data?.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={[styles.itemLabel, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.product_name} × {item.quantity}
            </Text>
            <Pressable onPress={() => handleRemoveItem(item.id)} accessibilityRole="button" accessibilityLabel="Retirer cet article" hitSlop={8}>
              <Ionicons name="close-circle" size={26} color={theme.danger} />
            </Pressable>
          </View>
        ))}

        {categoriesQuery.data && categoriesQuery.data.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsRow}>
            {categoriesQuery.data.map((cat) => {
              const selected = cat.id === selectedCategoryId;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategoryId(selected ? null : cat.id)}
                  style={[styles.categoryChip, { borderColor: selected ? cat.color : theme.border, backgroundColor: selected ? `${cat.color}22` : theme.surface }]}>
                  <View style={[styles.categoryChipDot, { backgroundColor: cat.color }]} />
                  <Text style={[styles.categoryChipLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {filteredStockItems.length > 0 ? (
          <View style={styles.suggestedItemsRow}>
            {filteredStockItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setNewItemName(item.name)}
                style={[styles.suggestedItemChip, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.suggestedItemLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.addItemRow}>
          <AutocompleteInput
            value={newItemName}
            onChangeText={setNewItemName}
            suggestions={productSuggestions}
            placeholder="Produit"
            containerStyle={styles.addItemInputWrapper}
            inputStyle={styles.addItemInput}
          />
          <TextInput
            value={newItemQuantity}
            onChangeText={setNewItemQuantity}
            placeholder="Qté"
            keyboardType="number-pad"
            placeholderTextColor={theme.textMuted}
            style={[styles.addItemQty, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.surface }]}
          />
          <Pressable onPress={handleAddItem} style={[styles.addItemButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={20} color={theme.textOnPrimary} />
          </Pressable>
        </View>
      </View>

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  value: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  sectionTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, marginBottom: spacing.xs },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  itemLabel: { fontSize: typography.size.base, flex: 1 },
  categoryChipsRow: { gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.lg },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    minHeight: 40,
  },
  categoryChipDot: { width: 10, height: 10, borderRadius: 5 },
  categoryChipLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  suggestedItemsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingTop: spacing.xs },
  suggestedItemChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1.5 },
  suggestedItemLabel: { fontSize: typography.size.sm },
  addItemRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  addItemInputWrapper: { flex: 1 },
  addItemInput: { minHeight: 44, paddingVertical: 0 },
  addItemQty: { width: 64, borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: spacing.sm, minHeight: 44, fontSize: typography.size.base },
  addItemButton: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  confirmRow: { flexDirection: 'row', gap: spacing.sm },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
});
