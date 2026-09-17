import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';
import { Screen, Title, ErrorText } from '@/components/ui';

type Status = 'pending' | 'verifying' | 'verified' | 'error';

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const incomingUrl = Linking.useURL();
  const [status, setStatus] = useState<Status>('pending');

  useEffect(() => {
    if (!incomingUrl) return;

    // Supabase's confirmation redirect appends tokens as a URL fragment
    // (#access_token=...&refresh_token=...) or an `error_description` on failure (FR-008).
    const fragment = incomingUrl.split('#')[1] ?? '';
    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      if (params.get('error') ?? params.get('error_description')) {
        setStatus('error');
        logEvent('email_verify', 'failure', { detail: params.get('error_description') ?? undefined });
      }
      return;
    }

    setStatus('verifying');
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ data, error }) => {
      if (error) {
        setStatus('error');
        logEvent('email_verify', 'failure', { detail: error.message });
        return;
      }
      setStatus('verified');
      logEvent('email_verify', 'success', { accountId: data.session?.user.id });
    });
  }, [incomingUrl]);

  return (
    <Screen centered>
      <Title>Confirm your email</Title>
      {status === 'pending' && (
        <Text accessibilityLiveRegion="polite">
          We sent a verification link to {email ?? 'your email'}. Open it on this device to
          continue.
        </Text>
      )}
      {status === 'verifying' && <Text accessibilityLiveRegion="polite">Verifying…</Text>}
      {status === 'verified' && (
        <Text accessibilityLiveRegion="polite">Email verified — you're all set.</Text>
      )}
      {status === 'error' && (
        <ErrorText>That verification link is invalid or expired. Please request a new one.</ErrorText>
      )}
    </Screen>
  );
}
