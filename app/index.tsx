import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

/**
 * Index (Entry Point): Gestisce il reindirizzamento iniziale dell'applicazione.
 * Controlla se l'utente ha una sessione attiva su Supabase e smista la navigazione.
 */
export default function Index() {
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    // Piccola pausa per garantire che il tema e i font siano pronti ed evitare flash grafici
    const timer = setTimeout(() => {
      checkUser();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Verifica la sessione dell'utente tramite il client Supabase.
   */
  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // Utente autenticato -> Dashboard principale
      router.replace('/(tabs)/today');
    } else {
      // Utente non autenticato -> Flusso di Login
      router.replace('/(auth)/login');
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
