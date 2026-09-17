// Design tokens for FocusFlow's design system — sourced directly from the
// current Claude Design prototype (FocusFlow.dc.html / FocusFlow
// Website.dc.html). The project's own design_handoff_focusflow/README.md is
// STALE — it still documents an earlier green palette; github.md's sync log
// records the switch to this orange-red one, confirmed against the live
// prototype files themselves (not just their prose description).
export const color = {
  text: '#1B2420',
  textSecondary: '#7A8580',
  textMuted: '#9CA6A0',
  textSubtle: '#9CA6A0',
  background: '#F7F8F5',
  surface: '#FFFFFF',
  border: '#E6E9E4',
  borderLight: '#EEF1EC',
  divider: '#E6E9E4',
  circleBorder: '#D8DDD5',
  tabInactive: '#B7BEB8',
  chevronMuted: '#C7CDC8',
  chartMuted: '#F2D6C2',
  chartDot: '#E4A583',
  primary: '#C1502E',
  primaryDark: '#9E3F22',
  primaryTint: '#FBE7DC',
  onPrimary: '#FFFFFF',
  upgradeCard: '#1B2420',
  error: '#C0503F',
  success: '#C1502E',
  destructive: '#C0503F',
  destructiveStrong: '#9C3F32',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
} as const;

export const fontSize = {
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  screenTitle: 22,
  title: 24,
} as const;

// Manrope isn't a variable font once loaded via expo-font — each weight is
// its own font family name, so weight selection happens via `fontFamily`,
// not the (ignored) `fontWeight` style prop. See app/_layout.tsx's useFonts.
export const font = {
  regular: 'Manrope_400Regular',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

export const shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
} as const;
