import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { useSignUp } from '@/features/auth/hooks/useSignUp';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { signUp, isSubmitting } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const s = makeStyles(theme);

  async function handleSubmit() {
    setError(null);
    const result = await signUp(email, password);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace({ pathname: '/(auth)/verify', params: { email } });
  }

  return (
    <View style={s.container}>
      <View style={s.icon}>
        <Image source={require('@/assets/images/fox-icon.png')} style={s.iconImage} resizeMode="contain" />
      </View>
      <Text style={s.title}>Create your account</Text>

      <TextInput
        style={s.input}
        placeholder="Email"
        placeholderTextColor={theme.textMuted}
        accessibilityLabel="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={s.input}
        placeholder="Password"
        placeholderTextColor={theme.textMuted}
        accessibilityLabel="Password"
        secureTextEntry
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
      />
      {error ? (
        <Text style={s.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Text style={s.microcopy}>By continuing you agree to our Terms and Privacy Policy.</Text>
      <Pressable
        style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Sign up"
      >
        <Text style={s.buttonText}>{isSubmitting ? 'Creating account…' : 'Create account'}</Text>
      </Pressable>
      <Link href="/(auth)/login" style={s.link} accessibilityRole="link">
        Already have an account? Sign in
      </Link>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: spacing.screenX, gap: 12, backgroundColor: theme.background },
    icon: {
      width: 56,
      height: 56,
      borderRadius: radii.icon,
      backgroundColor: theme.darkSurface,
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      overflow: 'hidden',
    },
    iconImage: { width: 56, height: 56 },
    title: { fontSize: 22, fontWeight: '800', color: theme.textPrimary, textAlign: 'center', marginBottom: 12 },
    input: {
      height: 52,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radii.input,
      paddingHorizontal: 16,
      backgroundColor: theme.surface,
      color: theme.textPrimary,
    },
    microcopy: { fontSize: 12, color: theme.textMuted, textAlign: 'center' },
    button: {
      height: 52,
      backgroundColor: theme.primary,
      borderRadius: radii.input,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    buttonPressed: { opacity: 0.85 },
    buttonText: { color: theme.surface, fontWeight: '700', fontSize: 16 },
    error: { color: theme.error },
    link: { textAlign: 'center', marginTop: 8, color: theme.textSecondary },
  });
}
