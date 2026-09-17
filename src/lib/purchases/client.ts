import Purchases from 'react-native-purchases';

// ponytail: lets callers (useSession's login/logout sync) skip RevenueCat
// calls entirely when no key is set, instead of hitting "no singleton
// instance" — remove once EXPO_PUBLIC_REVENUECAT_API_KEY is always required.
export let isPurchasesConfigured = false;

// research.md §5: react-native-purchases is a native module — this requires a
// dev build (expo-dev-client/EAS), not Expo Go.
export function configurePurchases(): void {
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
  if (!apiKey) {
    console.warn('EXPO_PUBLIC_REVENUECAT_API_KEY not set — skipping Purchases.configure()');
    return;
  }
  Purchases.configure({ apiKey });
  isPurchasesConfigured = true;
}
