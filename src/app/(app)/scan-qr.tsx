import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, LoadingState, ScreenContainer } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { getEquipmentById } from '@/services/equipment';

/** §40 : scanner un QR collé sur un équipement ramène directement à sa fiche (pas de deep link OS, tout se passe dans l'app). */
export default function ScanQrScreen() {
  const theme = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLooking, setIsLooking] = useState(false);

  async function handleScanned(value: string) {
    if (scanned || isLooking) return;
    setScanned(true);
    setIsLooking(true);
    setError(null);
    try {
      const equipment = await getEquipmentById(value.trim());
      if (!equipment) {
        setError("Ce QR code ne correspond à aucun équipement de l'application.");
        setScanned(false);
        return;
      }
      router.replace({ pathname: '/equipment', params: { openId: equipment.id } });
    } catch (err) {
      setError(getErrorMessage(err));
      setScanned(false);
    } finally {
      setIsLooking(false);
    }
  }

  if (Platform.OS === 'web') {
    return (
      <ScreenContainer scroll={false} style={styles.centered}>
        <Ionicons name="camera-outline" size={48} color={theme.textMuted} />
        <Text style={[styles.message, { color: theme.textPrimary }]}>Le scan de QR code est disponible sur l&apos;application mobile (iOS/Android).</Text>
      </ScreenContainer>
    );
  }

  if (!permission) {
    return (
      <ScreenContainer scroll={false} style={styles.centered}>
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer scroll={false} style={styles.centered}>
        <Ionicons name="camera-outline" size={48} color={theme.textMuted} />
        <Text style={[styles.message, { color: theme.textPrimary }]}>L&apos;accès à la caméra est nécessaire pour scanner les QR codes des équipements.</Text>
        <Button label="Autoriser la caméra" onPress={requestPermission} />
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={(result) => handleScanned(result.data)}
      />
      <View style={styles.overlay}>
        <View style={[styles.frame, { borderColor: theme.primary }]} />
        <Text style={styles.hint}>Vise le QR code collé sur l&apos;équipement</Text>
        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: theme.dangerTint }]}>
            <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          </View>
        ) : null}
      </View>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Fermer" style={[styles.closeButton, { backgroundColor: theme.surface }]}>
        <Ionicons name="close" size={24} color={theme.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  centered: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  message: { fontSize: typography.size.base, textAlign: 'center', maxWidth: 300 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  frame: { width: 220, height: 220, borderWidth: 3, borderRadius: 16 },
  hint: { color: 'white', fontSize: typography.size.base, fontWeight: typography.weight.medium },
  errorBanner: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 12, maxWidth: 300 },
  errorText: { fontSize: typography.size.sm, textAlign: 'center' },
  closeButton: { position: 'absolute', top: 60, right: spacing.lg, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
