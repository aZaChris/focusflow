import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { registerForPushNotificationsAsync } from '../../lib/notifications';

/**
 * RegisterScreen: Schermata per la creazione di nuovi account.
 * Registra l'utente su Supabase e inizializza il profilo e le notifiche.
 */
export default function RegisterScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Gestisce il processo di registrazione.
   */
  async function signUp() {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      Alert.alert('Attenzione', 'Inserisci sia email che password.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ 
      email: cleanEmail, 
      password 
    });
    
    if (error) {
      Alert.alert('Errore di Registrazione', error.message);
      setLoading(false);
    } else if (data.user) {
      // Inizializza il profilo utente (opzionale, Supabase può farlo con i trigger)
      await supabase.from('profiles').insert([{ id: data.user.id }]);
      
      // Registra le notifiche push
      await registerForPushNotificationsAsync(data.user.id);
      
      Alert.alert('Account Creato', 'Benvenuto su FocusFlow! Controlla la tua email per la conferma.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/today') }
      ]);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.primary, fontFamily: theme.typography.sans }]}>
            Inizia Ora
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Crea un account per sincronizzare le tue attività su tutti i dispositivi.
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

          <Input
            label="Password"
            placeholder="Crea una password sicura"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Button 
            title="Crea Account" 
            onPress={signUp} 
            loading={loading}
            style={styles.registerBtn}
          />
        </View>

        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.footer}
        >
          <Text style={[styles.footerText, { color: theme.colors.text }]}>
            Hai già un account? <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Accedi</Text>
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
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  form: { width: '100%' },
  registerBtn: { marginTop: 10 },
  footer: { marginTop: 30, alignItems: 'center' },
  footerText: { fontSize: 15 }
});
