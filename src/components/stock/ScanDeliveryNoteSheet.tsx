import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { analyzeDeliveryNote, type ExtractedDelivery } from '@/services/aiExtraction';

interface ScanDeliveryNoteSheetProps {
  visible: boolean;
  onClose: () => void;
  onExtracted: (draft: ExtractedDelivery) => void;
}

/** §aide IA (3e cas, bons de livraison) : photo -> extraction via analyze-delivery-note -> écran de rapprochement stock (DeliveryReceiptReviewSheet), jamais d'enregistrement automatique. */
export function ScanDeliveryNoteSheet({ visible, onClose, onExtracted }: ScanDeliveryNoteSheetProps) {
  const theme = useAppTheme();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setError(null);
    onClose();
  }

  async function processAsset(uri: string, mimeType: string) {
    setIsAnalyzing(true);
    setError(null);
    try {
      const file = new File(uri);
      const base64 = await file.base64();
      const extracted = await analyzeDeliveryNote(base64, mimeType);
      if (extracted.items.length === 0) {
        setError('Aucun article reconnu sur cette photo. Réessaie avec une photo plus nette, ou enregistre la réception manuellement depuis Stock.');
        return;
      }
      onExtracted(extracted);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleCamera() {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Autorisation caméra refusée.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) await processAsset(result.assets[0].uri, result.assets[0].mimeType ?? 'image/jpeg');
  }

  async function handleLibrary() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Autorisation galerie refusée.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) await processAsset(result.assets[0].uri, result.assets[0].mimeType ?? 'image/jpeg');
  }

  return (
    <Sheet visible={visible} onClose={handleClose} title="Scanner un bon de livraison">
      <Text style={[styles.intro, { color: theme.textSecondary }]}>
        Prends une photo (ou choisis-en une) du bon de livraison. Les articles reconnus seront proposés pour mise à jour du stock — à vérifier avant de
        valider.
      </Text>

      {isAnalyzing ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Analyse en cours...</Text>
        </View>
      ) : (
        <View style={styles.actionsRow}>
          <Pressable onPress={handleCamera} style={[styles.actionButton, { borderColor: theme.border }]} accessibilityRole="button" accessibilityLabel="Prendre une photo">
            <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>Prendre une photo</Text>
          </Pressable>
          <Pressable onPress={handleLibrary} style={[styles.actionButton, { borderColor: theme.border }]} accessibilityRole="button" accessibilityLabel="Choisir une image">
            <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>Choisir une image</Text>
          </Pressable>
        </View>
      )}

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: typography.size.sm, lineHeight: 20 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  loadingText: { fontSize: typography.size.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
});
