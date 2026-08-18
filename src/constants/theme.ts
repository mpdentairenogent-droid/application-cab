import { Platform } from 'react-native';

/**
 * Palette (§6) : blanc cassé / beige / bleu doux / bleu grisé / gris chaud /
 * vert sauge, + couleurs fonctionnelles vert/orange/rouge/bleu/gris. Toute
 * couleur utilisée dans l'app doit venir d'ici — jamais de hex en dur dans
 * un écran, sinon le design system perd son intérêt (§7).
 */
export const palette = {
  cream: '#FBFAF7',
  sand: '#F5F0E8',
  sandDark: '#EDE6D8',
  warmGray100: '#F0EEEA',
  warmGray300: '#D8D3CC',
  warmGray500: '#8B8680',
  warmGray700: '#6B6560',
  warmGray900: '#3D3935',

  sage: '#7C9885',
  sageDark: '#5F7A68',
  sageTint: '#E8F0E9',

  slateBlue: '#5B7C99',
  slateBlueDark: '#456075',
  slateBlueTint: '#EAF1F5',

  green: '#6B8F71',
  greenTint: '#E7F0E8',
  orange: '#C97B3D',
  orangeTint: '#FBEEE0',
  red: '#BC5449',
  redTint: '#FBEAE7',
  blue: '#5B84A3',
  blueTint: '#EAF1F5',
  gray: '#8B8680',
  grayTint: '#F0EEEA',

  white: '#FFFFFF',
  black: '#1F1D1B',
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  primary: string;
  primaryDark: string;
  primaryTint: string;
  secondary: string;
  secondaryDark: string;
  secondaryTint: string;
  success: string;
  successTint: string;
  warning: string;
  warningTint: string;
  danger: string;
  dangerTint: string;
  info: string;
  infoTint: string;
  neutral: string;
  neutralTint: string;
}

// Pas de "as const" ici : on veut le type ThemeColors (string), pas des
// littéraux exacts — sinon darkTheme (valeurs différentes) ne pourrait
// jamais avoir le même type que lightTheme.
export const lightTheme: ThemeColors = {
  background: palette.cream,
  surface: palette.white,
  surfaceAlt: palette.sand,
  border: palette.warmGray300,

  textPrimary: palette.warmGray900,
  textSecondary: palette.warmGray700,
  textMuted: palette.warmGray500,
  textOnPrimary: palette.white,

  primary: palette.sage,
  primaryDark: palette.sageDark,
  primaryTint: palette.sageTint,
  secondary: palette.slateBlue,
  secondaryDark: palette.slateBlueDark,
  secondaryTint: palette.slateBlueTint,

  success: palette.green,
  successTint: palette.greenTint,
  warning: palette.orange,
  warningTint: palette.orangeTint,
  danger: palette.red,
  dangerTint: palette.redTint,
  info: palette.blue,
  infoTint: palette.blueTint,
  neutral: palette.gray,
  neutralTint: palette.grayTint,
};

export const darkTheme: ThemeColors = {
  background: '#1C1B19',
  surface: '#26241F',
  surfaceAlt: '#302D27',
  border: '#3D3935',

  textPrimary: '#F5F0E8',
  textSecondary: '#D8D3CC',
  textMuted: '#9C9790',
  textOnPrimary: '#15201A',

  primary: '#8FAE97',
  primaryDark: '#729478',
  primaryTint: '#28352C',
  secondary: '#84A6BE',
  secondaryDark: '#6688A1',
  secondaryTint: '#233039',

  success: '#84AC8B',
  successTint: '#25322A',
  warning: '#DBA36A',
  warningTint: '#3A2E1F',
  danger: '#D08981',
  dangerTint: '#3A2622',
  info: '#89ADC4',
  infoTint: '#232F36',
  neutral: '#A6A19A',
  neutralTint: '#2C2A26',
};

export const typography = {
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  size: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, xl2: 24, xl3: 28, xl4: 34 },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: { tight: 1.15, normal: 1.4, relaxed: 1.6 },
} as const;

/** Base 4px — garde des espacements cohérents entre tous les écrans. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xl2: 24,
  xl3: 32,
  xl4: 40,
  xl5: 48,
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 } as const;

export const shadow = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    android: { elevation: 1 },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20 },
    android: { elevation: 8 },
    default: {},
  }),
} as const;

/** Type de statut fonctionnel (§6) : mappe vers success/warning/danger/info/neutral. */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
