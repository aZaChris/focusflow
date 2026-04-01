import { Platform } from 'react-native';

/**
 * Nota: RevenueCat richiede react-native-purchases e una build "Custom Dev Client" (non funziona in Expo Go classico).
 * Per attivarlo:
 * 1. npx expo install react-native-purchases
 * 2. Inserisci le tue chiavi API da RevenueCat
 * 3. Crea una dev build con EAS (eas build --profile development)
 */

const APIKeys = {
  apple: "REVENUECAT_APPLE_API_KEY",
  google: "REVENUECAT_GOOGLE_API_KEY"
};

export const initRevenueCat = async () => {
  // if (Platform.OS === 'ios') {
  //   await Purchases.configure({ apiKey: APIKeys.apple });
  // } else if (Platform.OS === 'android') {
  //   await Purchases.configure({ apiKey: APIKeys.google });
  // }
  console.log("RevenueCat Inizializzato (MOCK)");
};

export const checkProStatus = async () => {
  // try {
  //   const customerInfo = await Purchases.getCustomerInfo();
  //   if (typeof customerInfo.entitlements.active['pro'] !== "undefined") {
  //     return true;
  //   }
  // } catch (e) {
  //   console.warn("Errore controllo RevenueCat", e);
  // }
  console.log("Check Pro Status effettuato (MOCK) - Restituisce falso per testare il freemium");
  return false;
};
