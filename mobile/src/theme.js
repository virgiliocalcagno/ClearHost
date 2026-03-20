/**
 * ClearHost — Design System & Theme.
 * Material Design 3 inspired, light mode, premium feel.
 */

export const COLORS = {
  // Backgrounds
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Primary accent — vibrant teal/green
  primary: '#00BFA6',
  primaryLight: '#E0F7F3',
  primaryDark: '#00896D',

  // Secondary
  secondary: '#5B6EF5',
  secondaryLight: '#EEF0FF',

  // Semantic
  success: '#22C55E',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  // Status
  pendiente: '#F59E0B',
  enProgreso: '#5B6EF5',
  completada: '#22C55E',
  verificada: '#8B5CF6',

  // Text
  text: '#1A1C2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Shadows (iOS)
  shadow: '#000000',
};

export const SHADOWS = {
  card: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHover: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 6,
  },
  button: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  soft: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const FONTS = {
  h1: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  h3: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  body: { fontSize: 16, fontWeight: '400', color: COLORS.text, lineHeight: 24 },
  bodyMedium: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  caption: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  small: { fontSize: 12, fontWeight: '500', color: COLORS.textTertiary },
  button: { fontSize: 16, fontWeight: '700', color: COLORS.textInverse },
  buttonSmall: { fontSize: 14, fontWeight: '600' },
};
