import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { colors, typography } from '../../constants/theme';

/**
 * LoginScreen: Schermata per l'accesso degli utenti esistenti.
 * Utilizza Supabase Auth per la gestione delle credenziali.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Esegue il tentativo di accesso con email e password.
   */
  async function signIn() {
    if (!email || !password) {
      Alert.alert('Attenzione', 'Inserisci sia email che password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      Alert.alert('Errore di Accesso', error.message);
    } else {
      // Reindirizza alla schermata principale in caso di successo
      router.replace('/(tabs)/today');
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      {/* Titolo principale/Logo testuale */}
      <Text style={styles.title}>FocusFlow</Text>

      {/* Campo Email */}
      <TextInput
        style={styles.input}
        onChangeText={setEmail}
        value={email}
        placeholder="Email"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/* Campo Password */}
      <TextInput
        style={styles.input}
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />

      {/* Pulsante di Accesso */}
      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.7 }]} 
        disabled={loading} 
        onPress={signIn}
      >
        <Text style={styles.buttonText}>{loading ? 'Accesso in corso...' : 'Log in'}</Text>
      </TouchableOpacity>

      {/* Link per passare alla registrazione */}
      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.link}>Non hai un account? Registrati</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.bg, 
    padding: 20, 
    justifyContent: 'center' 
  },
  title: { 
    fontSize: 32, 
    fontFamily: typography.sans, 
    color: colors.accent, 
    textAlign: 'center', 
    marginBottom: 40, 
    fontWeight: 'bold' 
  },
  input: { 
    backgroundColor: colors.surface, 
    color: colors.text, 
    borderRadius: 8, 
    padding: 15, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  button: { 
    backgroundColor: colors.accent, 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 10 
  },
  buttonText: { 
    color: colors.bg, 
    fontFamily: typography.sans, 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  link: { 
    color: colors.text, 
    textAlign: 'center', 
    marginTop: 20, 
    textDecorationLine: 'underline' 
  }
});
