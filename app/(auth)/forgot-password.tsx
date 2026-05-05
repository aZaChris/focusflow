import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

/**
 * ForgotPasswordScreen: Permette agli utenti di richiedere il reset della password.
 */
export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Invia l'email di recupero tramite Supabase.
   */
  async function handleResetPassword() {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      Alert.alert('Attenzione', 'Inserisci il tuo indirizzo email.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: 'focusflow://reset-password',
    });
    
    if (error) {
      Alert.alert('Errore', error.message);
    } else {
      Alert.alert(
        'Email Inviata', 
        'Controlla la tua posta elettronica per le istruzioni su come reimpostare la password.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.sans }]}>
            Recupero Password
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Inserisci la tua email e ti invieremo un link per reimpostare la tua password.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="latua@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Button 
            title="Invia Link di Recupero" 
            onPress={handleResetPassword} 
            loading={loading}
            style={styles.resetBtn}
          />
        </View>

        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.footer}
        >
          <Text style={[styles.footerText, { color: theme.colors.primary, fontWeight: 'bold' }]}>
            Torna al Login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 25, justifyContent: 'center' },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  form: { width: '100%' },
  resetBtn: { marginTop: 10 },
  footer: { marginTop: 30, alignItems: 'center' },
  footerText: { fontSize: 15 }
});
