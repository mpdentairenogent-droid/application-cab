import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ViewProps, type ScrollViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ScreenContainerProps extends ViewProps {
  edges?: Edge[];
  /** La plupart des écrans (dashboards, listes) ont besoin de défiler — la valeur par défaut couvre le cas courant. */
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  onRefresh?: () => void;
  refreshing?: boolean;
  children: ReactNode;
}

// edges par défaut = ['top'] uniquement : la barre d'onglets gère déjà la
// safe area basse, doubler le padding y créerait un vide inutile (§5).
export function ScreenContainer({
  style,
  edges = ['top'],
  scroll = true,
  contentContainerStyle,
  onRefresh,
  refreshing = false,
  children,
  ...props
}: ScreenContainerProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView edges={edges} style={[styles.base, { backgroundColor: theme.background }]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} /> : undefined}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.flex, style]} {...props}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl4, gap: spacing.lg },
});
