import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Card, ChipSelect, EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { CategoryBadge } from '@/components/stock/CategoryBadge';
import { CategoryFormSheet } from '@/components/stock/CategoryFormSheet';
import { DeliveryReceiptReviewSheet } from '@/components/stock/DeliveryReceiptReviewSheet';
import { MaterialRequestDetailSheet } from '@/components/stock/MaterialRequestDetailSheet';
import { MaterialRequestFormSheet } from '@/components/stock/MaterialRequestFormSheet';
import { MaterialRequestsBoard } from '@/components/stock/MaterialRequestsBoard';
import { ScanDeliveryNoteSheet } from '@/components/stock/ScanDeliveryNoteSheet';
import { StockImportSheet } from '@/components/stock/StockImportSheet';
import { StockItemFormSheet } from '@/components/stock/StockItemFormSheet';
import { StockMovementFormSheet } from '@/components/stock/StockMovementFormSheet';
import { PERMISSIONS } from '@/constants/permissions';
import { spacing, typography } from '@/constants/theme';
import { MATERIAL_REQUEST_STATUS_LABEL, MATERIAL_REQUEST_STATUS_TONE, URGENCY_LABEL, URGENCY_TONE } from '@/constants/stockLabels';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDate } from '@/lib/format';
import { usePermissions } from '@/permissions/usePermissions';
import type { ExtractedDelivery } from '@/services/aiExtraction';
import { listAllMaterialRequests, setMaterialRequestStatus, summarizeRequestItems, type MaterialRequestWithItems } from '@/services/materialRequests';
import { listAllStockItems, listExpiringStock } from '@/services/stock';
import { listStockCategories } from '@/services/stockCategories';
import type { MaterialRequestRow, StockCategoryRow, StockItemRow } from '@/types/database';

type StockView = 'items' | 'categories' | 'requests' | 'expiring';
type RequestsLayout = 'list' | 'board';

const VIEW_OPTIONS = [
  { value: 'items' as const, label: 'Articles' },
  { value: 'categories' as const, label: 'Catégories' },
  { value: 'requests' as const, label: 'Demandes' },
  { value: 'expiring' as const, label: 'Péremptions' },
];

const REQUESTS_LAYOUT_OPTIONS = [
  { value: 'list' as const, label: 'Liste' },
  { value: 'board' as const, label: 'Tableau' },
];

export default function StockScreen() {
  const theme = useAppTheme();
  const { can } = usePermissions();
  const canManageStock = can(PERMISSIONS.MANAGE_STOCK);
  const canManageOrders = can(PERMISSIONS.MANAGE_ORDERS);
  const [view, setView] = useState<StockView>('items');
  const [requestsLayout, setRequestsLayout] = useState<RequestsLayout>('list');
  const queryClient = useQueryClient();

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItemRow | undefined>(undefined);
  const [movementItem, setMovementItem] = useState<StockItemRow | undefined>(undefined);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequestWithItems | undefined>(undefined);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StockCategoryRow | undefined>(undefined);
  const [importSheetOpen, setImportSheetOpen] = useState(false);
  const [scanDeliverySheetOpen, setScanDeliverySheetOpen] = useState(false);
  const [deliveryReviewOpen, setDeliveryReviewOpen] = useState(false);
  const [deliveryDraft, setDeliveryDraft] = useState<ExtractedDelivery | null>(null);

  function handleDeliveryExtracted(draft: ExtractedDelivery) {
    setScanDeliverySheetOpen(false);
    setDeliveryDraft(draft);
    setDeliveryReviewOpen(true);
  }

  const itemsQuery = useQuery({ queryKey: ['stock-items-all'], queryFn: listAllStockItems, enabled: view === 'items' });
  const requestsQuery = useQuery({ queryKey: ['material-requests-all'], queryFn: listAllMaterialRequests, enabled: view === 'requests' });
  const expiringQuery = useQuery({ queryKey: ['stock-expiring-all'], queryFn: () => listExpiringStock(100), enabled: view === 'expiring' });
  // Pas de garde `enabled` : utilisée à la fois pour afficher le badge de
  // catégorie dans "Articles" et pour la vue "Catégories" elle-même — liste
  // toujours modeste, autant l'avoir prête dès l'arrivée sur l'écran.
  const categoriesQuery = useQuery({ queryKey: ['stock-categories'], queryFn: listStockCategories });
  const categoryById = new Map((categoriesQuery.data ?? []).map((c) => [c.id, c]));

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['stock-items-all'] });
    queryClient.invalidateQueries({ queryKey: ['stock-expiring-all'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stock-alerts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-expiring-stock'] });
    queryClient.invalidateQueries({ queryKey: ['material-requests-all'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-material-requests'] });
    queryClient.invalidateQueries({ queryKey: ['stock-categories'] });
  }

  // Mise à jour optimiste du cache local pour un retour visuel immédiat au
  // dépôt d'une carte (glisser-déposer, §28) — sans ça, la carte reviendrait
  // brièvement à son ancienne colonne avant que la requête réseau n'aboutisse.
  async function handleRequestStatusChange(requestId: string, status: MaterialRequestRow['status']) {
    const previous = queryClient.getQueryData<MaterialRequestWithItems[]>(['material-requests-all']);
    queryClient.setQueryData<MaterialRequestWithItems[]>(['material-requests-all'], (old) => old?.map((r) => (r.id === requestId ? { ...r, status } : r)));
    try {
      await setMaterialRequestStatus(requestId, status);
      invalidateAll();
    } catch {
      queryClient.setQueryData(['material-requests-all'], previous);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Stock</Text>
        {view === 'items' && canManageStock ? (
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setImportSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Importer un fichier Excel"
              style={[styles.addButton, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name="document-attach-outline" size={22} color={theme.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => setScanDeliverySheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Scanner un bon de livraison"
              style={[styles.addButton, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name="camera-outline" size={22} color={theme.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => {
                setEditingItem(undefined);
                setItemFormOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Nouvel article"
              style={[styles.addButton, { backgroundColor: theme.primary }]}>
              <Ionicons name="add" size={24} color={theme.textOnPrimary} />
            </Pressable>
          </View>
        ) : null}
        {view === 'requests' ? (
          <Pressable
            onPress={() => setRequestFormOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Nouvelle demande"
            style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={24} color={theme.textOnPrimary} />
          </Pressable>
        ) : null}
        {view === 'categories' && canManageStock ? (
          <Pressable
            onPress={() => {
              setEditingCategory(undefined);
              setCategoryFormOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Nouvelle catégorie"
            style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={24} color={theme.textOnPrimary} />
          </Pressable>
        ) : null}
      </View>

      <ChipSelect label="Vue" options={VIEW_OPTIONS} value={view} onChange={setView} />

      {view === 'items' ? (
        itemsQuery.isLoading ? (
          <LoadingState />
        ) : itemsQuery.data?.length === 0 ? (
          <EmptyState title="Aucun article" />
        ) : (
          <View style={styles.list}>
            {itemsQuery.data?.map((item) => {
              const low = item.quantity <= item.minimum_quantity;
              const category = item.category_id ? categoryById.get(item.category_id) : undefined;
              return (
                <Card key={item.id} style={styles.row}>
                  {item.photo_url ? <Image source={{ uri: item.photo_url }} style={styles.thumbnail} /> : null}
                  <Pressable
                    style={styles.flex1}
                    onPress={() => {
                      if (!canManageStock) return;
                      setEditingItem(item);
                      setItemFormOpen(true);
                    }}>
                    <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemHint, { color: theme.textMuted }]}>
                      {item.quantity} {item.unit}
                      {item.location ? ` · ${item.location}` : ''}
                    </Text>
                    {category ? <CategoryBadge name={category.name} color={category.color} /> : null}
                  </Pressable>
                  {low ? <Badge label={item.quantity <= 0 ? 'Rupture' : 'Faible'} tone={item.quantity <= 0 ? 'danger' : 'warning'} /> : null}
                  {canManageStock ? (
                    <Pressable onPress={() => setMovementItem(item)} accessibilityRole="button" accessibilityLabel="Enregistrer un mouvement" hitSlop={8}>
                      <Ionicons name="swap-vertical" size={20} color={theme.secondary} />
                    </Pressable>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )
      ) : null}

      {view === 'categories' ? (
        categoriesQuery.isLoading ? (
          <LoadingState />
        ) : categoriesQuery.data?.length === 0 ? (
          <EmptyState title="Aucune catégorie" />
        ) : (
          <View style={styles.list}>
            {categoriesQuery.data?.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => {
                  if (!canManageStock) return;
                  setEditingCategory(category);
                  setCategoryFormOpen(true);
                }}>
                <Card style={styles.row}>
                  <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                  <Text style={[styles.itemTitle, styles.flex1, { color: theme.textPrimary }]} numberOfLines={1}>
                    {category.name}
                  </Text>
                  {canManageStock ? <Ionicons name="chevron-forward" size={18} color={theme.textMuted} /> : null}
                </Card>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      {view === 'requests' ? (
        <>
          {canManageOrders ? <ChipSelect label="Affichage" options={REQUESTS_LAYOUT_OPTIONS} value={requestsLayout} onChange={setRequestsLayout} /> : null}

          {requestsQuery.isLoading ? (
            <LoadingState />
          ) : requestsQuery.data?.length === 0 ? (
            <EmptyState title="Aucune demande" />
          ) : canManageOrders && requestsLayout === 'board' ? (
            <MaterialRequestsBoard requests={requestsQuery.data ?? []} onOpenRequest={setSelectedRequest} onStatusChange={handleRequestStatusChange} />
          ) : (
            <View style={styles.list}>
              {requestsQuery.data?.map((request) => (
                <Pressable key={request.id} onPress={() => setSelectedRequest(request)}>
                  <Card style={styles.row}>
                    <View style={styles.flex1}>
                      <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                        {summarizeRequestItems(request.items)}
                      </Text>
                      <Text style={[styles.itemHint, { color: theme.textMuted }]}>{formatDate(request.created_at)}</Text>
                    </View>
                    <Badge label={URGENCY_LABEL[request.urgency]} tone={URGENCY_TONE[request.urgency]} />
                    <Badge label={MATERIAL_REQUEST_STATUS_LABEL[request.status]} tone={MATERIAL_REQUEST_STATUS_TONE[request.status]} />
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </>
      ) : null}

      {view === 'expiring' ? (
        expiringQuery.isLoading ? (
          <LoadingState />
        ) : expiringQuery.data?.length === 0 ? (
          <EmptyState title="Rien n'expire bientôt" />
        ) : (
          <View style={styles.list}>
            {expiringQuery.data?.map((item) => (
              <Card key={item.id} style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemHint, { color: theme.textMuted }]}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
                <Badge label={item.expiry_bucket === 'expired' ? 'Expiré' : formatDate(item.expiry_date)} tone={item.expiry_bucket === 'expired' ? 'danger' : 'warning'} />
              </Card>
            ))}
          </View>
        )
      ) : null}

      <StockItemFormSheet
        visible={itemFormOpen}
        onClose={() => setItemFormOpen(false)}
        onSaved={() => {
          setItemFormOpen(false);
          invalidateAll();
        }}
        item={editingItem}
        existingItems={itemsQuery.data}
      />

      <CategoryFormSheet
        visible={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        onSaved={() => {
          setCategoryFormOpen(false);
          invalidateAll();
        }}
        onDeleted={() => {
          setCategoryFormOpen(false);
          invalidateAll();
        }}
        category={editingCategory}
      />

      <StockImportSheet
        visible={importSheetOpen}
        onClose={() => setImportSheetOpen(false)}
        onImported={() => {
          setImportSheetOpen(false);
          invalidateAll();
        }}
      />

      <ScanDeliveryNoteSheet visible={scanDeliverySheetOpen} onClose={() => setScanDeliverySheetOpen(false)} onExtracted={handleDeliveryExtracted} />

      <DeliveryReceiptReviewSheet
        visible={deliveryReviewOpen}
        onClose={() => {
          setDeliveryReviewOpen(false);
          setDeliveryDraft(null);
        }}
        onReceived={() => {
          setDeliveryReviewOpen(false);
          setDeliveryDraft(null);
          invalidateAll();
        }}
        draft={deliveryDraft}
        stockItems={itemsQuery.data ?? []}
      />

      <StockMovementFormSheet
        visible={!!movementItem}
        onClose={() => setMovementItem(undefined)}
        onSaved={() => {
          setMovementItem(undefined);
          invalidateAll();
        }}
        item={movementItem}
      />

      <MaterialRequestFormSheet
        visible={requestFormOpen}
        onClose={() => setRequestFormOpen(false)}
        onSaved={() => {
          setRequestFormOpen(false);
          invalidateAll();
        }}
      />

      <MaterialRequestDetailSheet
        visible={!!selectedRequest}
        onClose={() => setSelectedRequest(undefined)}
        onSaved={() => {
          setSelectedRequest(undefined);
          invalidateAll();
        }}
        request={selectedRequest}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  thumbnail: { width: 40, height: 40, borderRadius: 8 },
  flex1: { flex: 1 },
  itemTitle: { fontSize: typography.size.base, fontWeight: typography.weight.medium },
  itemHint: { fontSize: typography.size.xs },
  categoryDot: { width: 16, height: 16, borderRadius: 8 },
});
