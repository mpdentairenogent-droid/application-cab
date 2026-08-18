import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text } from 'react-native';

import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

import { Badge } from './Badge';
import { ScreenContainer } from './ScreenContainer';

interface ComingSoonProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  phase: string;
}

/**
 * Emplacement de navigation honnête pour un module pas encore construit :
 * la structure de navigation du rôle est déjà correcte (§23), le contenu
 * arrive à la phase indiquée. Différent d'une fausse fonctionnalité (§86) —
 * rien ici ne prétend faire quoi que ce soit.
 */
export function ComingSoon({ icon, title, phase }: ComingSoonProps) {
  const theme = useAppTheme();
  return (
    <ScreenContainer scroll={false} style={styles.container}>
      <Ionicons name={icon} size={40} color={theme.textMuted} />
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      <Badge label={`À venir — ${phase}`} tone="info" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  title: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold },
});
