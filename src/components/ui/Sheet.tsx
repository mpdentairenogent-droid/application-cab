import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Modale plein-écran glissée du bas — support des formulaires de création/édition dans toute l'app. */
export function Sheet({ visible, onClose, title, children, footer }: SheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View collapsable={false} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrapper}>
          {/* collapsable={false} : sans ça, RN peut « aplatir » cette View dans son
              parent au rendu natif iOS (optimisation interne) — quand ça arrive, le
              masque de découpe (overflow:hidden + coins arrondis) et le fond opaque
              qui vont avec ne sont plus appliqués du tout, et l'écran derrière la
              modale reste visible à travers, quelle que soit la hauteur du contenu
              (reproduit même sur la plus petite fiche, donc pas un problème de calcul
              de hauteur — les deux correctifs précédents sur ce fichier, en pixels et
              en couleur de fond, n'y changeaient donc rien). Forcer une vraie couche
              native ici est le correctif standard pour cette classe de bug. */}
          <View
            collapsable={false}
            style={[
              styles.sheet,
              { maxHeight: screenHeight * 0.92, backgroundColor: theme.background, paddingBottom: insets.bottom + spacing.lg },
            ]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
                {title}
              </Text>
              <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fermer">
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </Pressable>
            </View>
            {/* backgroundColor explicite : depuis que `content` est flex:1 (voir plus
                bas), le ScrollView est dimensionné par le flex et non plus par son
                contenu — sans sa propre couleur de fond, iOS le laisse transparent et
                l'écran derrière la modale transparaît (vu uniquement sur iPhone, pas
                sur le web, la modale y étant toujours dimensionnée par son contenu). */}
            <ScrollView
              style={[styles.content, { backgroundColor: theme.background }]}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetWrapper: {},
  // maxHeight est fixé en pixels sur `sheet` lui-même (voir le composant, via
  // useWindowDimensions) plutôt qu'ici en pourcentage — flexShrink reste utile
  // pour permettre à `sheet` de descendre sous sa taille naturelle quand un
  // formulaire long dépasse ce maxHeight, sans quoi le footer (bouton
  // Enregistrer/Créer) serait poussé hors de la zone visible.
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: 'hidden', flexShrink: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, flex: 1, marginRight: spacing.md },
  // flexGrow+flexShrink+flexBasis:'auto' — PAS le raccourci `flex: 1`, qui vaut
  // flexBasis:0%. Avec flexBasis:0%, ce ScrollView contribue une hauteur nulle
  // au calcul de la taille "auto" de `sheet` (qui n'a lui-même ni hauteur fixe
  // ni flexGrow) : sur un formulaire court, `sheet` se réduisait à la seule
  // hauteur du header, contenu et pied de page entièrement absents (constaté en
  // direct sur iPhone — carte blanche ne contenant que le titre). flexBasis:'auto'
  // fait contribuer sa vraie taille de contenu au calcul, tout en gardant
  // flexGrow/flexShrink pour absorber l'espace restant ou se comprimer avec un
  // scroll interne une fois `sheet` plafonné par son maxHeight sur un long formulaire.
  content: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', paddingHorizontal: spacing.lg },
  contentContainer: { gap: spacing.lg, paddingBottom: spacing.lg },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
