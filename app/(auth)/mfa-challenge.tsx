import { useState } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMfa } from '@/features/auth/hooks/useMfa';
import { Screen, Title, TextField, Button, ErrorText } from '@/components/ui';
import { spacing } from '@/theme/tokens';

export default function MfaChallengeScreen() {
  const { factorId } = useLocalSearchParams<{ factorId: string }>();
  const { verifyFactor, redeemBackupCode, isBusy } = useMfa();
  const [usingBackupCode, setUsingBackupCode] = useState(false);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const result = usingBackupCode
      ? await redeemBackupCode(email, password, code)
      : await verifyFactor(factorId!, code);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace('/');
  }

  return (
    <Screen centered>
      <Title>Two-factor verification</Title>
      {usingBackupCode ? (
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
          <TextField
            placeholder="Password"
            accessibilityLabel="Password"
            secureTextEntry
            textContentType="password"
            value={password}
            onChangeText={setPassword}
          />
          <TextField
            placeholder="Backup code"
            accessibilityLabel="Backup code"
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
          />
        </>
      ) : (
        <TextField
          placeholder="6-digit code"
          accessibilityLabel="6-digit authentication code"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />
      )}
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title={isBusy ? 'Verifying…' : 'Verify'} onPress={handleSubmit} disabled={isBusy} accessibilityLabel="Verify" />
      <Pressable
        onPress={() => setUsingBackupCode((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={
          usingBackupCode ? 'Use your authenticator app instead' : 'Use a backup code instead'
        }
      >
        <Text style={styles.link}>
          {usingBackupCode ? 'Use your authenticator app instead' : 'Use a backup code instead'}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { textAlign: 'center', marginTop: spacing.sm },
});
