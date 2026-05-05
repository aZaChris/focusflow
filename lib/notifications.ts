import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from './supabase';

const isExpoGoAndroid = Constants.appOwnership === 'expo' && Platform.OS === 'android';

/**
 * Richiede i permessi per le notifiche e restituisce lo stato.
 */
export async function requestNotificationPermissions() {
  if (isExpoGoAndroid) return true;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    return false;
  }
}

/**
 * Registra il dispositivo per le notifiche push e salva il token su Supabase.
 */
export async function registerForPushNotificationsAsync(userId: string) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    
    console.log("Push Token:", token);

    // Salva il token nel profilo utente su Supabase
    if (token) {
      await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', userId);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Aggiorna la notifica permanente nel blocco schermo (Android).
 */
export async function updateLockScreenNotification(enabled: boolean) {
  try {
    if (!enabled) {
      await Notifications.dismissNotificationAsync('timeline-sticky');
      return;
    }

    await Notifications.setNotificationChannelAsync('focusflow-timeline', {
      name: 'FocusFlow Timeline',
      importance: Notifications.AndroidImportance.MAX,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: undefined,
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "FocusFlow Timeline • LIVE",
        body: "La tua giornata è iniziata. Tocca per vedere i progressi.",
        sticky: true,
      },
      trigger: null, // immediato
      identifier: 'timeline-sticky',
    });
  } catch (e) {
    console.warn("Errore notifiche native:", e);
  }
}
