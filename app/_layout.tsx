import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useSession } from '@/features/auth/hooks/useSession';
import { shouldRedirectToLogin } from '@/features/auth/routeGuard';
import { configurePurchases } from '@/lib/purchases/client';
import { ThemeProvider } from '@/theme/ThemeContext';

function RootNavigator() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    configurePurchases();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (shouldRedirectToLogin(session, segments)) {
      router.replace('/(auth)/login');
    }
  }, [session, isLoading, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
