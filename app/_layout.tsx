import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useSession } from '@/features/auth/hooks/useSession';
import { shouldRedirectToLogin } from '@/features/auth/routeGuard';

export default function RootLayout() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (shouldRedirectToLogin(session, segments)) {
      router.replace('/(auth)/login');
    }
  }, [session, isLoading, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
