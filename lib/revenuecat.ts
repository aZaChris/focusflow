import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Gestione degli acquisti in-app tramite RevenueCat.
 * 
 * NOTA: RevenueCat richiede una build "Custom Dev Client" o una build di produzione (EAS).
 * In Expo Go, il modulo Purchases non è disponibile e verrà simulato.
 */

let Purchases: any = null;

// Tentativo di caricamento dinamico del modulo Purchases
if (Constants.appOwnership !== 'expo') {
  try {
    Purchases = require('react-native-purchases').default;
  } catch (e) {
    console.warn("RevenueCat: Modulo 'react-native-purchases' non trovato. Assicurati di essere in un Dev Client.");
  }
}

const APIKeys = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || "",
  google: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || ""
};

/**
 * Inizializza il modulo RevenueCat configurandolo per la piattaforma corrente.
 */
export const initRevenueCat = async () => {
  try {
    if (!Purchases) {
      console.log("RevenueCat: [MOCK] Inizializzazione simulata (Expo Go).");
      return;
    }

    if (Platform.OS === 'ios' && APIKeys.apple) {
      await Purchases.configure({ apiKey: APIKeys.apple });
      console.log("RevenueCat: Configurato con successo per iOS");
    } else if (Platform.OS === 'android' && APIKeys.google) {
      await Purchases.configure({ apiKey: APIKeys.google });
      console.log("RevenueCat: Configurato con successo per Android");
    }
  } catch (error) {
    console.error("RevenueCat: Errore durante l'inizializzazione", error);
  }
};

/**
 * Verifica se l'utente ha un abbonamento 'pro' attivo.
 */
export const checkProStatus = async (): Promise<boolean> => {
  try {
    if (!Purchases) {
      // In sviluppo (Expo Go), ritorniamo true per permettere il test delle feature
      return __DEV__;
    }

    const customerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active['pro'] !== "undefined";
  } catch (e) {
    console.warn("RevenueCat: Errore durante il controllo dello stato Pro", e);
    return false;
  }
};

/**
 * Avvia il processo di acquisto per un pacchetto specifico.
 */
export const purchasePackage = async (packageIdentifier: string) => {
  try {
    if (!Purchases) {
      Alert.alert("Simulazione", "Acquisto simulato con successo.");
      return true;
    }

    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      (p: any) => p.identifier === packageIdentifier
    );

    if (pkg) {
      await Purchases.purchasePackage(pkg);
      return true;
    }
    return false;
  } catch (e: any) {
    if (!e.userCancelled) {
      Alert.alert("Errore Acquisto", e.message);
    }
    return false;
  }
};

import { Alert } from 'react-native';
