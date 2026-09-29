import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { useSignIn } from '@/features/auth/hooks/useSignIn';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { signIn, isSubmitting } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const s = makeStyles(theme);

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
    <View style={s.container}>
      <View style={s.icon}>
        <Image source={require('@/assets/images/fox-icon.png')} style={s.iconImage} resizeMode="contain" />
      </View>
      <Text style={s.title}>Foxus</Text>
      <Text style={s.subtitle}>Calm focus, every day.</Text>

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
        textContentType="password"
        value={password}
        onChangeText={setPassword}
      />
      {error ? (
        <Text style={s.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Link href="/(auth)/forgot-password" style={s.forgotLink} accessibilityRole="link">
        Forgot password?
      </Link>
      <Pressable
        style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Log in"
      >
        <Text style={s.buttonText}>{isSubmitting ? 'Signing in…' : 'Log in'}</Text>
      </Pressable>
      <Link href="/(auth)/register" style={s.link} accessibilityRole="link">
        Need an account? Sign up
      </Link>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: spacing.screenX, gap: 12, backgroundColor: theme.background },
    icon: {
      width: 64,
      height: 64,
      borderRadius: radii.icon,
      backgroundColor: theme.darkSurface,
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      overflow: 'hidden',
    },
    iconImage: { width: 64, height: 64 },
    title: { fontSize: 24, fontWeight: '800', color: theme.textPrimary, textAlign: 'center' },
    subtitle: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 12 },
    input: {
      height: 52,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radii.input,
      paddingHorizontal: 16,
      backgroundColor: theme.surface,
      color: theme.textPrimary,
    },
    forgotLink: { textAlign: 'right', fontSize: 13, color: theme.textSecondary },
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
