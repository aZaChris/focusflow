import { useState } from 'react';
import { Text } from 'react-native';
import { usePasswordReset } from '@/features/auth/hooks/usePasswordReset';
import { Screen, Title, TextField, Button } from '@/components/ui';

export default function ForgotPasswordScreen() {
  const { requestReset, isSubmitting } = usePasswordReset();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    await requestReset(email);
    // FR-012: show the same confirmation regardless of whether the email is registered.
    setSent(true);
  }

  return (
    <Screen centered>
      <Title>Reset your password</Title>
      {sent ? (
        <Text accessibilityLiveRegion="polite">
          If an account exists for {email}, a reset link is on its way.
        </Text>
      ) : (
        <>
          <TextField
            placeholder="Email"
            accessibilityLabel="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          <Button title={isSubmitting ? 'Sending…' : 'Send reset link'} onPress={handleSubmit} disabled={isSubmitting} />
        </>
      )}
    </Screen>
  );
}
