import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Sheet } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { listAllStockItems } from '@/services/stock';
import { listStockCategories } from '@/services/stockCategories';
import { buildImportPlan, commitStockImport, generateStockImportTemplate, parseStockWorkbookFromUri, type ImportPlanRow, type SkippedRow } from '@/services/stockImport';

const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
];

interface StockImportSheetProps {
  visible: boolean;
  onClose: () => void;
  onImported: () => void;
}

/** §56-57 : import en masse du catalogue stock, avec repérage des doublons (contre l'existant et au sein du fichier) avant validation — voir services/stockImport.ts. */
export function StockImportSheet({ visible, onClose, onImported }: StockImportSheetProps) {
  const theme = useAppTheme();
  const [plan, setPlan] = useState<ImportPlanRow[] | null>(null);
  const [included, setIncluded] = useState<Record<number, boolean>>({});
  const [skippedRows, setSkippedRows] = useState<SkippedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsQuery = useQuery({ queryKey: ['stock-items-all'], queryFn: listAllStockItems, enabled: visible });
  const categoriesQuery = useQuery({ queryKey: ['stock-categories'], queryFn: listStockCategories, enabled: visible });

  function reset() {
    setPlan(null);
    setIncluded({});
    setSkippedRows([]);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handlePickFile() {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: EXCEL_MIME_TYPES });
      if (result.canceled || !result.assets[0]) return;

      setIsParsing(true);
      const { rows, skippedRows: skipped } = await parseStockWorkbookFromUri(result.assets[0].uri);
      const builtPlan = buildImportPlan(rows, itemsQuery.data ?? [], categoriesQuery.data ?? []);
      setPlan(builtPlan);
      setSkippedRows(skipped);
      setIncluded(Object.fromEntries(builtPlan.map((r) => [r.rowNumber, r.defaultInclude])));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsParsing(false);
    }
  }

  async function handleDownloadTemplate() {
    setError(null);
    try {
      const file = await generateStockImportTemplate();
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleConfirmImport() {
    if (!plan) return;
    setIsImporting(true);
    setError(null);
    try {
      const rowsToImport = plan.filter((row) => included[row.rowNumber]);
      await commitStockImport(rowsToImport);
      reset();
      onImported();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsImporting(false);
    }
  }

  const includedCount = plan ? plan.filter((row) => included[row.rowNumber]).length : 0;

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="Importer un fichier Excel"
      footer={
        plan ? (
          <>
            {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
            <Button label={`Importer ${includedCount} article${includedCount > 1 ? 's' : ''}`} onPress={handleConfirmImport} loading={isImporting} disabled={includedCount === 0} fullWidth />
          </>
        ) : undefined
      }>
      {!plan ? (
        <View style={styles.intro}>
          <Text style={[styles.introText, { color: theme.textSecondary }]}>
            Colonnes reconnues : Nom (obligatoire), Catégorie, Référence, Quantité, Unité, Seuil minimum, Emplacement, Prix unitaire. L&apos;ordre n&apos;a pas
            d&apos;importance.
          </Text>
          <Button label="Télécharger un modèle" variant="outline" onPress={handleDownloadTemplate} />
          <Button label="Choisir un fichier" onPress={handlePickFile} loading={isParsing} />
          {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
        </View>
      ) : (
        <View style={styles.list}>
          <Pressable onPress={handlePickFile}>
            <Text style={[styles.link, { color: theme.primary }]}>Choisir un autre fichier</Text>
          </Pressable>

          {skippedRows.length > 0 ? (
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              {skippedRows.length} ligne{skippedRows.length > 1 ? 's' : ''} ignorée{skippedRows.length > 1 ? 's' : ''} (nom manquant) : ligne{skippedRows.length > 1 ? 's' : ''}{' '}
              {skippedRows.map((r) => r.rowNumber).join(', ')}.
            </Text>
          ) : null}

          {plan.map((row) => {
            const isIncluded = !!included[row.rowNumber];
            const warning = row.existingMatch
              ? row.existingMatch.exact
                ? `Déjà dans le stock : "${row.existingMatch.item.name}"`
                : `Ressemble à "${row.existingMatch.item.name}" déjà en stock`
              : row.batchMatch
                ? row.batchMatch.exact
                  ? `Doublon de la ligne ${row.batchMatch.rowNumber} de ce fichier`
                  : `Ressemble à la ligne ${row.batchMatch.rowNumber} de ce fichier`
                : null;

            return (
              <Pressable
                key={row.rowNumber}
                onPress={() => setIncluded((prev) => ({ ...prev, [row.rowNumber]: !prev[row.rowNumber] }))}
                style={styles.row}>
                <Ionicons name={isIncluded ? 'checkbox' : 'square-outline'} size={24} color={isIncluded ? theme.primary : theme.textMuted} />
                <View style={styles.flex1}>
                  <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text style={[styles.itemHint, { color: theme.textMuted }]}>
                    {row.quantity} {row.unit}
                    {row.newCategoryName ? ` · nouvelle catégorie "${row.newCategoryName}"` : ''}
                  </Text>
                  {warning ? <Text style={[styles.warning, { color: theme.warning }]}>{warning}</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.md },
  introText: { fontSize: typography.size.sm, lineHeight: 20 },
  list: { gap: spacing.sm },
  link: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, textAlign: 'center', paddingVertical: spacing.xs },
  hint: { fontSize: typography.size.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  flex1: { flex: 1 },
  itemName: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  itemHint: { fontSize: typography.size.xs, marginTop: 2 },
  warning: { fontSize: typography.size.xs, marginTop: 2, fontWeight: typography.weight.medium },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
});
