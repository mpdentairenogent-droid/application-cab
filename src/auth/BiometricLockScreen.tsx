import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface BiometricLockScreenProps {
  onUnlock: () => Promise<boolean>;
}

export function BiometricLockScreen({ onUnlock }: BiometricLockScreenProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    onUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + spacing.xl4 }]}>
      <Ionicons name="lock-closed" size={48} color={theme.primary} />
      <Text style={[styles.title, { color: theme.textPrimary }]}>Application verrouillée</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>Déverrouille avec Face ID, Touch ID ou ton empreinte pour continuer.</Text>
      <Button label="Déverrouiller" onPress={onUnlock} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold },
  description: { fontSize: typography.size.base, textAlign: 'center', maxWidth: 300 },
});
