import { useEffect, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { useSession } from '@/features/auth/hooks/useSession';
import { shouldRedirectToLogin } from '@/features/auth/routeGuard';
import { configurePurchases } from '@/lib/purchases/client';
import { getEnabled } from '@/features/lockscreen/lockscreenPreference';
import { postLockscreenNotification } from '@/features/lockscreen/lockscreenNotification';
import { registerLockscreenRefreshTask } from '@/features/lockscreen/lockscreenRefreshTask';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  // Handoff: design tokens use Manrope 400/600/700/800 by fontFamily name —
  // these must be loaded before any screen renders, or text falls back to
  // the system font until this resolves.
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    configurePurchases();
  }, []);

  useEffect(() => {
    // FR-001/FR-003 (007-lockscreen-timeline): if the user already turned this
    // on, keep the lock-screen notification current from app launch/foreground —
    // T016's background task covers refresh while the app is closed.
    getEnabled().then((enabled) => {
      if (enabled) postLockscreenNotification();
    });
    // FR-004 (007-lockscreen-timeline): keep refreshing on its own schedule
    // whether or not 006's home-screen widget is also pinned (research.md §3).
    registerLockscreenRefreshTask();
  }, []);

  useEffect(() => {
    // FR-008: selecting the lock-screen notification opens the app directly
    // to the timeline (research.md §7) — explicit, rather than relying only
    // on the OS's own default tap-to-open behavior (which has had version-
    // specific gaps for background/closed apps).
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      router.replace('/');
    });
    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    if (isLoading) return;

    if (shouldRedirectToLogin(session, segments)) {
      router.replace('/(auth)/login');
    }
  }, [session, isLoading, segments, router]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="subscription" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
