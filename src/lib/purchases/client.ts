import Purchases from 'react-native-purchases';

// research.md §5: react-native-purchases is a native module — this requires a
// dev build (expo-dev-client/EAS), not Expo Go.
export function configurePurchases(): void {
  Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY! });
}
