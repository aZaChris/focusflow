// Design tokens from the Foxus mobile handoff (fox-icon + green brand).
// Light values are the handoff's own spec ("colors... are final"). Dark
// values aren't in the handoff — it explicitly ships no dark theme, only a
// settings toggle — so this is a reasonable extrapolation of the same brand
// (kept saturation/hue, inverted lightness), not a spec'd design.
export interface Theme {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  primary: string;
  primaryTint: string;
  darkSurface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  error: string;
  tabInactive: string;
}

export const lightTheme: Theme = {
  background: '#F7F8F5',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1EC',
  border: '#E6E9E4',
  primary: '#2F6B4F',
  primaryTint: '#E7F0EA',
  darkSurface: '#0F2318',
  textPrimary: '#1B2420',
  textSecondary: '#7A8580',
  textMuted: '#9CA6A0',
  error: '#C0503F',
  tabInactive: '#B7BEB8',
};

export const darkTheme: Theme = {
  background: '#12140F',
  surface: '#1B1F17',
  surfaceAlt: '#242B1F',
  border: '#2E362A',
  primary: '#4C9270',
  primaryTint: '#1C3327',
  darkSurface: '#0A150E',
  textPrimary: '#EDF1EA',
  textSecondary: '#9FAA9A',
  textMuted: '#71796D',
  error: '#E07A6A',
  tabInactive: '#4B534A',
};

export const radii = {
  card: 20,
  input: 14,
  pill: 14,
  icon: 20,
} as const;

export const spacing = {
  screenX: 24,
  screenTop: 64,
  cardGap: 16,
} as const;
