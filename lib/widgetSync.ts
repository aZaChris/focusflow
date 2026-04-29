import { updateWidget } from '../modules/focus-widget';
import { Platform } from 'react-native';
import { colors } from '../constants/theme';

/**
 * Sincronizza le abitudini attuali con il widget Android.
 * @param habits Lista delle abitudini dal database.
 */
export async function syncWidget(habits: any[]) {
  if (Platform.OS !== 'android') return;

  try {
    const activities = habits
      .filter(h => h.scheduled_time)
      .map(h => {
        // Convertiamo "HH:MM:SS" in ore decimali
        const [hours, minutes] = h.scheduled_time.split(':').map(Number);
        const startHour = hours + (minutes / 60);
        const endHour = startHour + (h.duration_minutes / 60);
        
        return {
          title: h.title,
          startHour,
          endHour,
          color: h.is_completed ? colors.activities.teal : colors.activities.purple
        };
      });

    // Invia i dati al modulo nativo
    await updateWidget(activities);
    console.log("Widget sincronizzato con successo:", activities.length, "attività");
  } catch (error) {
    console.error("Errore sincronizzazione widget:", error);
  }
}
