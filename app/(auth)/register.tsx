import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useSignUp } from '@/features/auth/hooks/useSignUp';
import { Screen, Title, TextField, Button, ErrorText, FoxMark } from '@/components/ui';
import { color, font, fontSize, spacing } from '@/theme/tokens';

export default function RegisterScreen() {
  const { signUp, isSubmitting } = useSignUp();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const result = await signUp(email, password, fullName.trim() || undefined);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace({ pathname: '/(auth)/verify', params: { email } });
  }

  return (
    <Screen centered>
      <View style={styles.header}>
        <FoxMark size={56} />
        <Title style={styles.title}>Create your account</Title>
      </View>

      <TextField placeholder="Full name" accessibilityLabel="Full name" textContentType="name" value={fullName} onChangeText={setFullName} />
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
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={isSubmitting ? 'Creating account…' : 'Create account'} onPress={handleSubmit} disabled={isSubmitting} accessibilityLabel="Sign up" />
      <Text style={styles.terms}>By continuing you agree to our Terms and Privacy Policy.</Text>
      <Link href="/(auth)/login" style={styles.footerLink} accessibilityRole="link">
        Already have an account? Sign in
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  title: { fontSize: fontSize.xl, textAlign: 'center' },
  terms: { fontSize: 12, fontFamily: font.regular, color: color.textSubtle, textAlign: 'center' },
  footerLink: { textAlign: 'center', marginTop: spacing.sm, fontFamily: font.regular, color: color.textSecondary },
});
