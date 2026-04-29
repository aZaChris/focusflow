import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGoAndroid = Constants.appOwnership === 'expo' && Platform.OS === 'android';

/**
 * Richiede i permessi per le notifiche.
 */
export async function requestNotificationPermissions() {
  if (isExpoGoAndroid) return true;

  try {
    const Notifications = require('expo-notifications');
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
 * Aggiorna la notifica permanente nel blocco schermo.
 */
export async function updateLockScreenNotification(enabled: boolean) {
  try {
    const Notifications = require('expo-notifications');
    if (!enabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    await Notifications.setNotificationChannelAsync('focusflow-timeline', {
      name: 'FocusFlow Timeline',
      importance: Notifications.AndroidImportance.MAX,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: undefined,
    });

    await Notifications.presentNotificationAsync({
      title: "FocusFlow Timeline • LIVE",
      body: "La tua giornata è iniziata. Tocca per vedere i progressi.",
      sticky: true,
      identifier: 'timeline-sticky',
    });
  } catch (e) {
    console.warn("Errore notifiche native:", e);
  }
}
