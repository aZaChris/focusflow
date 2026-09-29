import Purchases from 'react-native-purchases';
import { logEvent } from '@/lib/logging/logger';

// research.md §5: react-native-purchases is a native module — this requires a
// dev build (expo-dev-client/EAS), not Expo Go.
let configured = false;

// RevenueCat setup (004-subscription-monetization's checklist) is a separate,
// later step from having the app run at all — a missing key here must not
// crash app boot, it just means subscription status is unavailable until
// EXPO_PUBLIC_REVENUECAT_API_KEY is set. Every other Purchases.* call in the
// app must go through isPurchasesConfigured() first — calling the native SDK
// before configure() is a documented RevenueCat crash, not a soft failure.
export function configurePurchases(): void {
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
  if (!apiKey) {
    logEvent('purchases_configure', 'failure', { detail: 'EXPO_PUBLIC_REVENUECAT_API_KEY is not set' });
    return;
  }
  Purchases.configure({ apiKey });
  configured = true;
}

export function isPurchasesConfigured(): boolean {
  return configured;
}
