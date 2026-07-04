import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { useSession } from '@/features/auth/hooks/useSession';
import { useDeleteAccount } from '@/features/auth/hooks/useDeleteAccount';
import { useMfa } from '@/features/auth/hooks/useMfa';

type MfaStep = 'idle' | 'enrolling' | 'backup-codes' | 'enabled' | 'disabling';

export default function SettingsScreen() {
  const { signOut } = useSession();
  const { deleteAccount, isDeleting } = useDeleteAccount();
  const { enroll, verifyFactor, generateBackupCodes, disableMfa, isBusy } = useMfa();
  const [error, setError] = useState<string | null>(null);

  const [mfaStep, setMfaStep] = useState<MfaStep>('idle');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  function confirmDelete() {
    // User Story 5, Acceptance Scenario 1: explicit confirmation before an irreversible action.
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setError(null);
            const result = await deleteAccount();
            if (!result.ok) setError(result.message);
          },
        },
      ],
    );
  }

  async function startEnroll() {
    setError(null);
    const result = await enroll();
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFactorId(result.factorId);
    setSecret(result.secret);
    setMfaStep('enrolling');
  }

  async function confirmEnroll() {
    setError(null);
    const result = await verifyFactor(factorId!, code);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setCode('');
    // FR-016: backup codes are shown exactly once, right after enabling 2FA.
    const codesResult = await generateBackupCodes();
    if (!codesResult.ok) {
      setError(codesResult.message);
      setMfaStep('enabled');
      return;
    }
    setBackupCodes(codesResult.codes);
    setMfaStep('backup-codes');
  }

  async function confirmDisable() {
    setError(null);
    const result = await disableMfa(factorId!, code);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setCode('');
    setFactorId(null);
    setMfaStep('idle');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Pressable style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Two-factor authentication</Text>
      {mfaStep === 'idle' && (
        <Pressable style={styles.button} onPress={startEnroll} disabled={isBusy}>
          <Text style={styles.buttonText}>Enable 2FA</Text>
        </Pressable>
      )}
      {mfaStep === 'enrolling' && (
        <>
          <Text>Add this secret to your authenticator app:</Text>
          <Text selectable style={styles.secret}>{secret}</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit code"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />
          <Pressable style={styles.button} onPress={confirmEnroll} disabled={isBusy}>
            <Text style={styles.buttonText}>Confirm</Text>
          </Pressable>
        </>
      )}
      {mfaStep === 'backup-codes' && (
        <>
          <Text>Save these backup codes — shown only once:</Text>
          {backupCodes.map((c) => (
            <Text key={c} selectable style={styles.secret}>{c}</Text>
          ))}
          <Pressable style={styles.button} onPress={() => setMfaStep('enabled')}>
            <Text style={styles.buttonText}>Done</Text>
          </Pressable>
        </>
      )}
      {mfaStep === 'enabled' && (
        <Pressable style={styles.deleteButton} onPress={() => setMfaStep('disabling')}>
          <Text style={styles.buttonText}>Disable 2FA</Text>
        </Pressable>
      )}
      {mfaStep === 'disabling' && (
        <>
          <Text>Enter a current code to confirm disabling 2FA:</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit code"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />
          <Pressable style={styles.deleteButton} onPress={confirmDisable} disabled={isBusy}>
            <Text style={styles.buttonText}>Confirm disable</Text>
          </Pressable>
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.deleteButton} onPress={confirmDelete} disabled={isDeleting}>
        <Text style={styles.buttonText}>{isDeleting ? 'Deleting…' : 'Delete account'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 24 },
  button: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  deleteButton: { backgroundColor: '#600', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  secret: { fontFamily: 'monospace', fontSize: 16 },
  error: { color: '#c00' },
});
