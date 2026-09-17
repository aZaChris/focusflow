import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useSignIn } from '@/features/auth/hooks/useSignIn';
import { Screen, Title, TextField, Button, ErrorText, FoxMark } from '@/components/ui';
import { color, font, fontSize, spacing } from '@/theme/tokens';

// Handoff: centered fox mark + title + subtitle, 52px fields, "Forgot
// password?" right-aligned. No "Continue with Apple" here — the mockup shows
// one, but this app has no Apple Sign-In integration to back it (no OAuth
// provider wired up); a decorative button that does nothing on tap would be
// worse than omitting it.
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
    <Screen centered>
      <View style={styles.header}>
        <FoxMark size={64} />
        <Title style={styles.title}>FocusFlow</Title>
        <Text style={styles.subtitle}>Calm focus, every day.</Text>
      </View>

      <TextField
        placeholder="Email"
        accessibilityLabel="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        placeholder="Password"
        accessibilityLabel="Password"
        secureTextEntry
        textContentType="password"
        value={password}
        onChangeText={setPassword}
      />
      <Link href="/(auth)/forgot-password" style={styles.forgotLink} accessibilityRole="link">
        Forgot password?
      </Link>

      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={isSubmitting ? 'Signing in…' : 'Log in'} onPress={handleSubmit} disabled={isSubmitting} accessibilityLabel="Sign in" />

      <Link href="/(auth)/register" style={styles.footerLink} accessibilityRole="link">
        Need an account? Sign up
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  title: { marginTop: spacing.sm },
  subtitle: { fontSize: fontSize.base, fontFamily: font.regular, color: color.textSecondary },
  forgotLink: { alignSelf: 'flex-end', fontSize: 13, fontFamily: font.regular, color: color.textSecondary },
  footerLink: { textAlign: 'center', marginTop: spacing.sm, fontFamily: font.regular, color: color.textSecondary },
});
