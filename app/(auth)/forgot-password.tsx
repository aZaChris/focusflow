import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { usePasswordReset } from '@/features/auth/hooks/usePasswordReset';

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
    <View style={styles.container}>
      <Text style={styles.title}>Reset your password</Text>
      {sent ? (
        <Text accessibilityLiveRegion="polite">
          If an account exists for {email}, a reset link is on its way.
        </Text>
      ) : (
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
          <Pressable
            style={styles.button}
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Send reset link"
          >
            <Text style={styles.buttonText}>{isSubmitting ? 'Sending…' : 'Send reset link'}</Text>
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
});
