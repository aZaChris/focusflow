import FocusWidgetModule from './src/FocusWidgetModule';

/**
 * INTERFACCIA PER IL WIDGET NATIVO
 * Rappresenta la struttura dati minima necessaria al codice Kotlin/Swift 
 * per visualizzare i blocchi attività fuori dall'app.
 */
export interface ActivityBlock {
  title: string;       // Titolo dell'attività (es. "Lavoro")
  startHour: number;   // Ora di inizio decimale (es. 9.5 per 09:30)
  endHour: number;     // Ora di fine decimale
  color: string;       // Colore in formato HEX (es. "#c8f04a")
}

/**
 * updateWidget: Invia i dati delle attività correnti al modulo nativo del widget.
 * I dati vengono serializzati in JSON per essere facilmente processati dal codice nativo.
 * 
 * @param activities Array di oggetti ActivityBlock.
 */
export async function updateWidget(activities: ActivityBlock[]): Promise<void> {
  const module = FocusWidgetModule;
  if (!module) {
    console.warn("FocusWidgetModule non è disponibile in questo ambiente (es. iOS o simulatore).");
    return;
  }
  return await module.updateWidget(JSON.stringify(activities));
}

/**
 * requestPinAppWidget: Richiede al sistema (Android) di mostrare il popup
 * per aggiungere automaticamente il widget alla Home Screen.
 * Funziona solo su Android 8.0 (API 26) e versioni successive.
 */
export async function requestPinAppWidget(): Promise<void> {
  const module = FocusWidgetModule;
  if (!module) return;
  return await module.requestPinAppWidget();
}

export default {
  updateWidget,
  requestPinAppWidget,
};
