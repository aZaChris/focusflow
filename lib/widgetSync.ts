import { updateWidget } from '../modules/focus-widget';
import { Platform } from 'react-native';
import { palette } from '../constants/theme';

/**
 * syncWidget: Funzione di utilità che funge da ponte tra i dati di Supabase
 * e il modulo nativo del widget Android.
 * 
 * Trasforma i dati grezzi delle abitudini nel formato `ActivityBlock` richiesto
 * dal widget nativo (Kotlin).
 * 
 * @param habits Lista delle abitudini recuperate dal database.
 */
export async function syncWidget(habits: any[]) {
  // Il widget nativo personalizzato è attualmente disponibile solo su Android
  if (Platform.OS !== 'android') return;

  try {
    const activities = habits
      .filter(h => h.scheduled_time) // Filtra solo le attività che hanno un orario pianificato
      .map(h => {
        /**
         * CONVERSIONE ORARIO:
         * Il database salva "HH:MM:SS" (stringa).
         * Il widget nativo richiede ore decimali (float) per calcoli geometrici più semplici.
         */
        const [hours, minutes] = h.scheduled_time.split(':').map(Number);
        const startHour = hours + (minutes / 60);
        const endHour = startHour + (h.duration_minutes / 60);
        
        return {
          title: h.title,
          startHour,
          endHour,
          // Cambia il colore del blocco nel widget in base allo stato di completamento
          color: h.is_completed ? palette.activities.teal : palette.activities.purple
        };
      });

    // Chiamata al bridge nativo per aggiornare i dati persistenti del widget
    await updateWidget(activities);
    console.log("Widget sincronizzato con successo:", activities.length, "attività");
  } catch (error) {
    console.error("Errore sincronizzazione widget:", error);
  }
}
