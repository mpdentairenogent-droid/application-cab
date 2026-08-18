import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type ThemeColors } from '@/constants/theme';

/**
 * Nommé useAppTheme (pas useTheme) pour ne pas entrer en collision avec le
 * useTheme de @react-navigation/expo-router, qui gère le thème de la barre
 * de navigation, pas les couleurs des écrans.
 */
export function useAppTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
