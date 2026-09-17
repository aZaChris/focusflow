import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';
import { usePasswordReset } from '@/features/auth/hooks/usePasswordReset';
import { Screen, Title, TextField, Button, ErrorText } from '@/components/ui';

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
    <Screen centered>
      <Title>Set a new password</Title>
      {linkStatus === 'pending' && <Text accessibilityLiveRegion="polite">Confirming your reset link…</Text>}
      {linkStatus === 'error' && (
        <ErrorText>This reset link is invalid or expired. Please request a new one.</ErrorText>
      )}
      {linkStatus === 'ready' && (
        <>
          <TextField
            placeholder="New password"
            accessibilityLabel="New password"
            secureTextEntry
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <Button
            title={isSubmitting ? 'Saving…' : 'Save new password'}
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityLabel="Save new password"
          />
        </>
      )}
    </Screen>
  );
}
