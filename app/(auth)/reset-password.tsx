import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';
import { usePasswordReset } from '@/features/auth/hooks/usePasswordReset';

type LinkStatus = 'pending' | 'ready' | 'error';

export default function ResetPasswordScreen() {
  const incomingUrl = Linking.useURL();
  const { setNewPassword, isSubmitting } = usePasswordReset();
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('pending');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!incomingUrl) return;

    // Same fragment-based tokens (or error) as the email-verification redirect (FR-008:
    // an already-used or expired link comes back as `error=access_denied`).
    const fragment = incomingUrl.split('#')[1] ?? '';
    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      if (params.get('error')) {
        setLinkStatus('error');
        logEvent('password_reset_link', 'failure', {
          detail: params.get('error_description') ?? undefined,
        });
      }
      return;
    }

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error: sessionError }) => {
      setLinkStatus(sessionError ? 'error' : 'ready');
    });
  }, [incomingUrl]);

  async function handleSubmit() {
    setError(null);
    const result = await setNewPassword(password);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set a new password</Text>
      {linkStatus === 'pending' && <Text accessibilityLiveRegion="polite">Confirming your reset link…</Text>}
      {linkStatus === 'error' && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          This reset link is invalid or expired. Please request a new one.
        </Text>
      )}
      {linkStatus === 'ready' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="New password"
            accessibilityLabel="New password"
            secureTextEntry
            textContentType="newPassword"
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
            accessibilityLabel="Save new password"
          >
            <Text style={styles.buttonText}>{isSubmitting ? 'Saving…' : 'Save new password'}</Text>
          </Pressable>
        </>
      )}
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
});
