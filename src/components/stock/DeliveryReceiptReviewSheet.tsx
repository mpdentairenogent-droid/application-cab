import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Button, Sheet } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import type { ExtractedDelivery } from '@/services/aiExtraction';
import { buildDeliveryPlan, commitDeliveryReceipt } from '@/services/deliveryReceipt';
import type { StockItemRow } from '@/types/database';

interface DeliveryReceiptReviewSheetProps {
  visible: boolean;
  onClose: () => void;
  onReceived: () => void;
  draft: ExtractedDelivery | null;
  stockItems: StockItemRow[];
}

/** Étape 2 du scan de bon de livraison : rapprochement flou avec le catalogue stock existant (services/deliveryReceipt.ts), tout reste décochable/modifiable avant validation — jamais d'application automatique. */
export function DeliveryReceiptReviewSheet({ visible, onClose, onReceived, draft, stockItems }: DeliveryReceiptReviewSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const [included, setIncluded] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = useMemo(() => (draft ? buildDeliveryPlan(draft.items, stockItems) : []), [draft, stockItems]);

  useEffect(() => {
    setIncluded(Object.fromEntries(plan.map((row) => [row.rowNumber, !!row.match])));
    // Réinitialisé uniquement à l'arrivée d'un nouveau brouillon (nouveau scan), pas à chaque refetch de stockItems.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function handleClose() {
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    if (!profile) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const rowsToApply = plan.filter((row) => included[row.rowNumber]);
      await commitDeliveryReceipt(rowsToApply, profile.id);
      onReceived();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const includedCount = plan.filter((row) => included[row.rowNumber]).length;

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="Réception de livraison"
      footer={
        <>
          {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
          <Button
            label={`Ajouter au stock (${includedCount} article${includedCount > 1 ? 's' : ''})`}
            onPress={handleConfirm}
            loading={isSubmitting}
            disabled={includedCount === 0}
            fullWidth
          />
        </>
      }>
      {draft?.supplierName || draft?.deliveryDate ? (
        <Text style={[styles.subhead, { color: theme.textSecondary }]}>{[draft.supplierName, draft.deliveryDate].filter(Boolean).join(' · ')}</Text>
      ) : null}

      <View style={styles.list}>
        {plan.map((row) => {
          const isIncluded = !!included[row.rowNumber];
          return (
            <Pressable
              key={row.rowNumber}
              onPress={() => row.match && setIncluded((prev) => ({ ...prev, [row.rowNumber]: !prev[row.rowNumber] }))}
              disabled={!row.match}
              style={[styles.row, !row.match ? styles.rowDisabled : null]}>
              <Ionicons
                name={row.match ? (isIncluded ? 'checkbox' : 'square-outline') : 'help-circle-outline'}
                size={24}
                color={row.match && isIncluded ? theme.primary : theme.textMuted}
              />
              <View style={styles.flex1}>
                <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {row.match ? row.match.item.name : row.extractedName}
                </Text>
                <Text style={[styles.itemHint, { color: theme.textMuted }]}>+{row.quantity}</Text>
                {!row.match ? (
                  <Text style={[styles.warning, { color: theme.warning }]}>
                    Non reconnu (extrait : « {row.extractedName} ») — ajoute-le dans Stock puis relance la réception.
                  </Text>
                ) : !row.match.exact ? (
                  <Text style={[styles.warning, { color: theme.warning }]}>Rapproché de « {row.match.item.name} » — vérifie que c&apos;est le bon article.</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  subhead: { fontSize: typography.size.sm, marginBottom: spacing.sm },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  rowDisabled: { opacity: 0.6 },
  flex1: { flex: 1 },
  itemName: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  itemHint: { fontSize: typography.size.xs, marginTop: 2 },
  warning: { fontSize: typography.size.xs, marginTop: 2, fontWeight: typography.weight.medium },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
});
