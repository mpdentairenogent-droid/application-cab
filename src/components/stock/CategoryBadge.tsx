import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface CategoryBadgeProps {
  name: string;
  color: string;
}

/** Point coloré + nom — rendu compact d'une catégorie de stock dans une liste (couleur définie par l'utilisateur, voir CATEGORY_COLORS). */
export function CategoryBadge({ name, color }: CategoryBadgeProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color: theme.textSecondary }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: typography.size.xs },
});
