import { Platform } from 'react-native';
// DISABILITATO TEMPORANEAMENTE PER EXPO GO
// import Purchases from 'react-native-purchases';

/**
 * Gestione degli acquisti in-app tramite RevenueCat.
 * 
 * NOTA: RevenueCat richiede una build "Custom Dev Client" e non funziona nell'Expo Go standard.
 * Le chiavi API devono essere caricate tramite file .env (EXPO_PUBLIC_...).
 */

// Chiavi API caricate dalle variabili d'ambiente
const APIKeys = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || "",
  google: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || ""
};

/**
 * Inizializza il modulo RevenueCat configurandolo per la piattaforma corrente.
 * Deve essere chiamato all'avvio dell'app (es. in app/_layout.tsx).
 */
export const initRevenueCat = async () => {
  try {
    /* DISABILITATO PER EXPO GO
    if (Platform.OS === 'ios' && APIKeys.apple) {
      await Purchases.configure({ apiKey: APIKeys.apple });
      console.log("RevenueCat: Configurato con successo per iOS");
    } else if (Platform.OS === 'android' && APIKeys.google) {
      await Purchases.configure({ apiKey: APIKeys.google });
      console.log("RevenueCat: Configurato con successo per Android");
    } else {
      console.warn("RevenueCat: Chiavi API mancanti o piattaforma non supportata.");
    }
    */
    console.log("RevenueCat: [MOCK EXPO GO] Inizializzazione fittizia.");
  } catch (error) {
    console.error("RevenueCat: Errore durante l'inizializzazione", error);
  }
};

/**
 * Verifica se l'utente ha un abbonamento 'pro' attivo.
 * @returns {Promise<boolean>} Vero se l'utente è Pro, falso altrimenti.
 */
export const checkProStatus = async (): Promise<boolean> => {
  try {
    /* DISABILITATO PER EXPO GO
    const customerInfo = await Purchases.getCustomerInfo();
    // Verifichiamo se l'entitlement 'pro' è presente tra quelli attivi
    return typeof customerInfo.entitlements.active['pro'] !== "undefined";
    */
    console.log("RevenueCat: [MOCK EXPO GO] Richiesta status pro (Ritorno False).");
    return false;
  } catch (e) {
    console.warn("RevenueCat: Errore durante il controllo dello stato Pro", e);
    return false;
  }
};
