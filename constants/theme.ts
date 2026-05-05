export const palette = {
  bg: '#0a0a12',
  surface: '#13131a',
  surface2: '#0e0e14',
  border: '#1e1e28',
  accent: '#c8f04a',
  accentDim: '#c8f04a44',
  text: '#f0f0f8',
  muted: '#555566',
  
  // Light Palette
  bgLight: '#f8f9fa',
  surfaceLight: '#ffffff',
  surface2Light: '#f1f3f5',
  borderLight: '#dee2e6',
  accentLight: '#82c91e',
  textLight: '#212529',
  mutedLight: '#868e96',

  activities: {
    teal:   '#4af0c8',
    purple: '#7b61ff',
    coral:  '#D85A30',
    blue:   '#378ADD',
    amber:  '#BA7517',
    red:    '#ff6b6b',
  }
};

export const darkTheme = {
  colors: {
    background: palette.bg,
    surface: palette.surface,
    surface2: palette.surface2,
    border: palette.border,
    primary: palette.accent,
    primaryDim: palette.accentDim,
    text: palette.text,
    textMuted: palette.muted,
    error: palette.activities.red,
    activities: palette.activities,
  },
  typography: {
    mono: 'SpaceMono',
    sans: 'Inter',
  }
};

export const lightTheme = {
  colors: {
    background: palette.bgLight,
    surface: palette.surfaceLight,
    surface2: palette.surface2Light,
    border: palette.borderLight,
    primary: palette.accentLight,
    primaryDim: '#82c91e33',
    text: palette.textLight,
    textMuted: palette.mutedLight,
    error: palette.activities.red,
    activities: palette.activities,
  },
  typography: {
    mono: 'SpaceMono',
    sans: 'Inter',
  }
};

// Legacy support for existing components
export const colors = darkTheme.colors;
export const typography = darkTheme.typography;
