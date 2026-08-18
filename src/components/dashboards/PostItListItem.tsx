import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { spacing, typography } from '@/constants/theme';
import type { PostItRow } from '@/types/database';

// Couleurs de texte volontairement fixes (pas de useAppTheme) : un Post-it
// pastel reste lisible en clair comme en sombre, comme un vrai post-it papier.
interface PostItListItemProps {
  postIt: PostItRow;
  /** minWidth par défaut pensé pour un ScrollView horizontal (dashboard) ; passer { minWidth: undefined } dans une grille flexWrap. */
  style?: ViewStyle;
}

export function PostItListItem({ postIt, style }: PostItListItemProps) {
  return (
    <View style={[styles.card, { backgroundColor: postIt.color }, style]}>
      {postIt.title ? <Text style={styles.title}>{postIt.title}</Text> : null}
      <Text style={styles.body} numberOfLines={3}>
        {postIt.body}
      </Text>
      <Text style={styles.meta}>{new Date(postIt.created_at).toLocaleDateString('fr-FR')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: spacing.md, gap: 4, minWidth: 220 },
  title: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: '#3D3935' },
  body: { fontSize: typography.size.base, color: '#3D3935' },
  meta: { fontSize: typography.size.xs, marginTop: 4, color: '#3D393599' },
});
