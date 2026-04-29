import FocusWidgetModule from './src/FocusWidgetModule';

export interface ActivityBlock {
  title: string;
  startHour: number;
  endHour: number;
  color: string;
}

/**
 * Aggiorna il widget Android con i nuovi dati delle attività.
 * @param activities Array di attività con ora inizio, fine e colore hex.
 */
export async function updateWidget(activities: ActivityBlock[]): Promise<void> {
  const module = FocusWidgetModule;
  if (!module) {
    console.warn("FocusWidgetModule is not available in this environment.");
    return;
  }
  return await module.updateWidget(JSON.stringify(activities));
}

export async function requestPinAppWidget(): Promise<void> {
  const module = FocusWidgetModule;
  if (!module) return;
  return await module.requestPinAppWidget();
}

export default {
  updateWidget,
};
