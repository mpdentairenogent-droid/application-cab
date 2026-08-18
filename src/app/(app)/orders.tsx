import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Card, EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { OrderDetailSheet } from '@/components/orders/OrderDetailSheet';
import { OrderFormSheet } from '@/components/orders/OrderFormSheet';
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/constants/orderLabels';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDate } from '@/lib/format';
import { listOrders, type OrderWithSupplier } from '@/services/orders';

export default function OrdersScreen() {
  const theme = useAppTheme();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<OrderWithSupplier | undefined>(undefined);
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrders });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Commandes</Text>
        <Pressable onPress={() => setFormOpen(true)} accessibilityRole="button" accessibilityLabel="Nouvelle commande" style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={24} color={theme.textOnPrimary} />
        </Pressable>
      </View>

      {ordersQuery.isLoading ? (
        <LoadingState />
      ) : ordersQuery.data?.length === 0 ? (
        <EmptyState title="Aucune commande" />
      ) : (
        <View style={styles.list}>
          {ordersQuery.data?.map((order) => (
            <Pressable key={order.id} onPress={() => setSelected(order)}>
              <Card style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {order.order_number || order.supplierName || 'Commande'}
                  </Text>
                  <Text style={[styles.itemHint, { color: theme.textMuted }]}>
                    {order.supplierName ? `${order.supplierName} · ` : ''}
                    {formatDate(order.ordered_at)}
                  </Text>
                </View>
                <Badge label={ORDER_STATUS_LABEL[order.status]} tone={ORDER_STATUS_TONE[order.status]} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      <OrderFormSheet
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          invalidate();
        }}
      />

      <OrderDetailSheet
        visible={!!selected}
        onClose={() => setSelected(undefined)}
        onSaved={() => {
          setSelected(undefined);
          invalidate();
        }}
        order={selected}
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
});
