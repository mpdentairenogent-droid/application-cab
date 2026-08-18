import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type View as RNView } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Badge } from '@/components/ui';
import { MATERIAL_REQUEST_STATUS_OPTIONS, URGENCY_LABEL, URGENCY_TONE } from '@/constants/stockLabels';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { summarizeRequestItems, type MaterialRequestWithItems } from '@/services/materialRequests';
import type { MaterialRequestRow } from '@/types/database';

interface ColumnBounds {
  status: MaterialRequestRow['status'];
  x: number;
  width: number;
}

interface MaterialRequestsBoardProps {
  requests: MaterialRequestWithItems[];
  onOpenRequest: (request: MaterialRequestWithItems) => void;
  onStatusChange: (id: string, status: MaterialRequestRow['status']) => void;
}

const COLUMN_WIDTH = 220;

/**
 * §28 : glisser une demande d'une colonne de statut à une autre. Le tableau
 * est figé (scroll horizontal désactivé) pendant un glissement pour que les
 * limites de colonnes mesurées au début du geste restent valides jusqu'au
 * relâchement — évite de suivre le défilement en continu.
 */
export function MaterialRequestsBoard({ requests, onOpenRequest, onStatusChange }: MaterialRequestsBoardProps) {
  const theme = useAppTheme();
  const [isDragging, setIsDragging] = useState(false);
  const columnRefs = useRef<(RNView | null)[]>([]);
  const columnBounds = useRef<ColumnBounds[]>([]);

  function measureColumns() {
    const results: ColumnBounds[] = [];
    let pending = MATERIAL_REQUEST_STATUS_OPTIONS.length;
    MATERIAL_REQUEST_STATUS_OPTIONS.forEach((option, index) => {
      const node = columnRefs.current[index];
      if (!node) {
        pending -= 1;
        return;
      }
      node.measureInWindow((x, _y, width) => {
        results.push({ status: option.value, x, width });
        pending -= 1;
        if (pending === 0) columnBounds.current = results;
      });
    });
  }

  function handleDragStart() {
    measureColumns();
    setIsDragging(true);
  }

  function handleDrop(requestId: string, sourceStatus: MaterialRequestRow['status'], dropX: number) {
    setIsDragging(false);
    const target = columnBounds.current.find((c) => dropX >= c.x && dropX <= c.x + c.width);
    if (target && target.status !== sourceStatus) {
      onStatusChange(requestId, target.status);
    }
  }

  return (
    <ScrollView horizontal scrollEnabled={!isDragging} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board}>
      {MATERIAL_REQUEST_STATUS_OPTIONS.map((option, index) => {
        const columnRequests = requests.filter((r) => r.status === option.value);
        return (
          <View
            key={option.value}
            ref={(el) => {
              columnRefs.current[index] = el;
            }}
            style={[styles.column, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <View style={styles.columnHeader}>
              <Text style={[styles.columnTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {option.label}
              </Text>
              <Badge label={String(columnRequests.length)} tone="neutral" />
            </View>
            {columnRequests.length === 0 ? <Text style={[styles.emptyColumn, { color: theme.textMuted }]}>—</Text> : null}
            {columnRequests.map((request) => (
              <RequestCard key={request.id} request={request} onPress={() => onOpenRequest(request)} onDragStart={handleDragStart} onDrop={handleDrop} />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

interface RequestCardProps {
  request: MaterialRequestWithItems;
  onPress: () => void;
  onDragStart: () => void;
  onDrop: (requestId: string, sourceStatus: MaterialRequestRow['status'], dropX: number) => void;
}

function RequestCard({ request, onPress, onDragStart, onDrop }: RequestCardProps) {
  const theme = useAppTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(onPress)();
  });

  // Nécessite une petite pression maintenue avant d'activer le glissement :
  // laisse le tap rapide (ouvrir la fiche) et le scroll vertical de la page
  // fonctionner normalement sans être capturés par le geste de drag.
  const pan = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart(() => {
      isActive.value = true;
      runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      runOnJS(onDrop)(request.id, request.status, event.absoluteX);
    })
    .onFinalize(() => {
      isActive.value = false;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const composed = Gesture.Exclusive(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    zIndex: isActive.value ? 10 : 0,
    shadowOpacity: isActive.value ? 0.2 : 0,
    elevation: isActive.value ? 6 : 0,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, animatedStyle]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={2}>
          {summarizeRequestItems(request.items)}
        </Text>
        <Badge label={URGENCY_LABEL[request.urgency]} tone={URGENCY_TONE[request.urgency]} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  board: { gap: spacing.md, paddingBottom: spacing.md },
  column: { width: COLUMN_WIDTH, borderRadius: radius.lg, borderWidth: 1, padding: spacing.sm },
  columnHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs, paddingBottom: spacing.sm },
  columnTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, flexShrink: 1, marginRight: spacing.xs },
  emptyColumn: { textAlign: 'center', fontSize: typography.size.sm, paddingVertical: spacing.md },
  card: { borderRadius: radius.md, borderWidth: 1, padding: spacing.sm, marginBottom: spacing.sm, gap: spacing.xs },
  cardTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
});
