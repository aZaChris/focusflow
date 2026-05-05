import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { registerForPushNotificationsAsync } from '../../lib/notifications';

/**
 * LoginScreen: Schermata di accesso principale.
 * Implementa il login con Supabase e la registrazione automatica delle notifiche push.
 */
export default function LoginScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Gestisce il processo di sign-in.
   */
  async function signIn() {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      Alert.alert('Attenzione', 'Inserisci sia email che password.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: cleanEmail, 
      password 
    });
    
    if (error) {
      Alert.alert('Errore di Accesso', error.message);
      setLoading(false);
    } else if (data.user) {
      // Registra le notifiche push per l'utente loggato
      await registerForPushNotificationsAsync(data.user.id);
      router.replace('/(tabs)/today');
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
            FocusFlow
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Torna a gestire il tuo tempo in modo consapevole.
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
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity 
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotBtn}
          >
            <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
              Password dimenticata?
            </Text>
          </TouchableOpacity>

          <Button 
            title="Accedi" 
            onPress={signIn} 
            loading={loading}
            style={styles.loginBtn}
          />

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textMuted }]}>oppure</Text>
            <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
          </View>

          <Button 
            title="Accedi come Ospite (Dev Mode)" 
            variant="outline"
            onPress={() => router.replace('/(tabs)/today')}
            style={styles.guestBtn}
          />
        </View>

        <TouchableOpacity 
          onPress={() => router.push('/(auth)/register')}
          style={styles.footer}
        >
          <Text style={[styles.footerText, { color: theme.colors.text }]}>
            Non hai un account? <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Registrati</Text>
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
  title: { fontSize: 48, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  form: { width: '100%' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { fontSize: 14, fontWeight: '600' },
  loginBtn: { marginBottom: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 15, fontSize: 14 },
  guestBtn: { marginBottom: 30 },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { fontSize: 15 }
});
