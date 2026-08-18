import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * §57 : bandeau de connectivité, honnête sur ce qu'il représente. Les
 * formulaires de l'app font des appels réseau directs (pas de file d'attente
 * de mutations) : une action tentée hors ligne échoue immédiatement avec un
 * message clair (voir getErrorMessage dans chaque *FormSheet), jamais un faux
 * "Enregistré" — ce bandeau prévient donc en amont plutôt que de prétendre
 * mettre les écritures en attente, ce qui ne serait pas vrai.
 */
export function OfflineBanner() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + spacing.xs, backgroundColor: theme.warningTint }]}>
      <Ionicons name="cloud-offline-outline" size={16} color={theme.warning} />
      <Text style={[styles.text, { color: theme.warning }]}>Hors ligne — les données affichées peuvent être obsolètes, les modifications ne seront pas enregistrées</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingBottom: spacing.xs, paddingHorizontal: spacing.md },
  text: { fontSize: typography.size.xs, fontWeight: typography.weight.medium, textAlign: 'center', flexShrink: 1 },
});
