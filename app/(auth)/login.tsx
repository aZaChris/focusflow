import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { useSignIn } from '@/features/auth/hooks/useSignIn';

export default function LoginScreen() {
  const { signIn, isSubmitting } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const result = await signIn(email, password);
    if (!result.ok) {
      if ('mfaRequired' in result) {
        router.push({ pathname: '/(auth)/mfa-challenge', params: { factorId: result.factorId } });
        return;
      }
      setError(result.message);
      return;
    }
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        accessibilityLabel="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        accessibilityLabel="Password"
        secureTextEntry
        textContentType="password"
        value={password}
        onChangeText={setPassword}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Pressable
        style={styles.button}
        onPress={handleSubmit}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Sign in"
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Signing in…' : 'Sign in'}</Text>
      </Pressable>
      <Link href="/(auth)/forgot-password" style={styles.link} accessibilityRole="link">
        Forgot your password?
      </Link>
      <Link href="/(auth)/register" style={styles.link} accessibilityRole="link">
        Need an account? Sign up
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  button: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#c00' },
  link: { textAlign: 'center', marginTop: 8 },
});
