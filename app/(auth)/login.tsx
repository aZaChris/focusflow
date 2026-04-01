import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { colors, typography } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Errore', error.message);
    } else {
      router.replace('/(tabs)/today');
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FocusFlow</Text>
      <TextInput
        style={styles.input}
        onChangeText={setEmail}
        value={email}
        placeholder="Email"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} disabled={loading} onPress={signIn}>
        <Text style={styles.buttonText}>{loading ? 'Accesso...' : 'Log in'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.link}>Non hai un account? Registrati</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20, justifyContent: 'center' },
  title: { fontSize: 32, fontFamily: typography.sans, color: colors.accent, textAlign: 'center', marginBottom: 40, fontWeight: 'bold' },
  input: { backgroundColor: colors.surface, color: colors.text, borderRadius: 8, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: colors.border },
  button: { backgroundColor: colors.accent, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: colors.bg, fontFamily: typography.sans, fontWeight: 'bold', fontSize: 16 },
  link: { color: colors.text, textAlign: 'center', marginTop: 20, textDecorationLine: 'underline' }
});
