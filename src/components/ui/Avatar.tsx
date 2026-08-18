import { Image, StyleSheet, Text, View } from 'react-native';

import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface AvatarProps {
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  size?: number;
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Pas de champ "couleur" dédié sur profiles : on dérive une teinte stable du
// nom pour que chaque personne garde toujours la même couleur d'avatar.
const AVATAR_PALETTE = ['#7C9885', '#5B7C99', '#C97B3D', '#BC5449', '#8B8680', '#6B8F71'];
function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function Avatar({ firstName, lastName, imageUrl, size = 40 }: AvatarProps) {
  const theme = useAppTheme();
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={dimension} accessibilityLabel={`${firstName} ${lastName}`} />;
  }

  return (
    <View style={[dimension, styles.fallback, { backgroundColor: colorFor(`${firstName}${lastName}`) }]} accessibilityLabel={`${firstName} ${lastName}`}>
      <Text style={[styles.initials, { fontSize: size * 0.4, color: theme.textOnPrimary }]}>{initials(firstName, lastName)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: typography.weight.semibold },
});
