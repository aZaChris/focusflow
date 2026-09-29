import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { lightTheme, darkTheme, type Theme } from '@/theme/tokens';

type Scheme = 'light' | 'dark';
const STORAGE_KEY = 'theme_scheme_override';

interface ThemeContextValue {
  scheme: Scheme;
  theme: Theme;
  setScheme: (scheme: Scheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [scheme, setSchemeState] = useState<Scheme>(systemScheme);

  // Settings' "Dark mode" toggle (handoff §6) is a manual override on top of
  // the system default — persisted so it survives app restarts.
  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setSchemeState(stored);
    });
  }, []);

  function setScheme(next: Scheme) {
    setSchemeState(next);
    SecureStore.setItemAsync(STORAGE_KEY, next);
  }

  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  return <ThemeContext.Provider value={{ scheme, theme, setScheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
