import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { colors } from '../constants/theme';

/**
 * Index (Entry Point): Gestisce il reindirizzamento iniziale.
 * Controlla se l'utente ha una sessione attiva su Supabase.
 */
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    // 1. Controlla la sessione corrente
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // Utente già loggato -> Vai alla dashboard
      router.replace('/(tabs)/today');
    } else {
      // Nessuna sessione -> Vai al login
      router.replace('/(auth)/login');
    }
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
