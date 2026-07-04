import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMfa } from '@/features/auth/hooks/useMfa';

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
    <View style={styles.container}>
      <Text style={styles.title}>Two-factor verification</Text>
      {usingBackupCode ? (
        <>
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
          <TextInput
            style={styles.input}
            placeholder="Backup code"
            accessibilityLabel="Backup code"
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
          />
        </>
      ) : (
        <TextInput
          style={styles.input}
          placeholder="6-digit code"
          accessibilityLabel="6-digit authentication code"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />
      )}
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Pressable
        style={styles.button}
        onPress={handleSubmit}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityLabel="Verify"
      >
        <Text style={styles.buttonText}>{isBusy ? 'Verifying…' : 'Verify'}</Text>
      </Pressable>
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
