import { Stack } from 'expo-router';

/**
 * AuthLayout: Gestisce la navigazione interna per il modulo di autenticazione.
 * Include le schermate di login e registrazione.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Schermata di accesso */}
      <Stack.Screen name="login" />
      {/* Schermata di registrazione (se presente) */}
      <Stack.Screen name="register" />
    </Stack>
  );
}
