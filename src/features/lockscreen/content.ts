import { timeToPosition } from '@/features/timeline/time';
import type { WidgetState } from '@/features/widget/widgetState';

export interface LockscreenContent {
  title: string;
  body: string;
  /** Expanded multi-line body (Android BigTextStyle) — the actual "crop" of the day. */
  bigText: string;
}

const BAR_LENGTH = 12;

// ponytail: an ASCII bar is the honest "crop" here, not a pixel snapshot of the
// timeline canvas — a bitmap crop needs a headless render pass (no screen exists
// when this refreshes in the background, same constraint 006 already documents),
// which is real native R&D. Upgrade path: render via a RemoteViews-based widget
// primitive (like react-native-android-widget does for the home-screen widget)
// once that's worth the investment.
function elapsedBar(startTime: string, endTime: string, nowTime: string): string {
  const start = timeToPosition(startTime, 1);
  const end = timeToPosition(endTime, 1);
  const now = timeToPosition(nowTime, 1);
  const fraction = end === start ? 1 : Math.min(1, Math.max(0, (now - start) / (end - start)));
  const filled = Math.round(fraction * BAR_LENGTH);
  return '▓'.repeat(filled) + '░'.repeat(BAR_LENGTH - filled);
}

// FR-parity with the widget (widgetState.ts): every WidgetState.kind renders
// something explicit — no case falls through to a blank/broken notification.
export function buildLockscreenContent(state: WidgetState, nowTime: string): LockscreenContent {
  switch (state.kind) {
    case 'signed_out':
      return { title: 'Foxus', body: 'Accedi per vedere la tua giornata.', bigText: 'Accedi per vedere la tua giornata.' };
    case 'empty':
      return { title: 'Foxus', body: 'Niente in programma oggi.', bigText: 'Niente in programma oggi.' };
    case 'nothing_left':
      return { title: 'Foxus', body: 'Niente in questo momento.', bigText: 'Niente in questo momento.' };
    case 'current_only':
      return {
        title: `Ora: ${state.current.title}`,
        body: `Fino alle ${state.current.end_time}`,
        bigText: `Ora: ${state.current.title}\n${elapsedBar(state.current.start_time, state.current.end_time, nowTime)} fino alle ${state.current.end_time}\n\nNiente altro oggi.`,
      };
    case 'next_only':
      return {
        title: `Prossimo: ${state.next.title}`,
        body: `Alle ${state.next.start_time}`,
        bigText: `Niente in questo momento.\n\nProssimo: ${state.next.title} alle ${state.next.start_time}`,
      };
    case 'current_and_next':
      return {
        title: `Ora: ${state.current.title}`,
        body: `Poi: ${state.next.title} (${state.next.start_time})`,
        bigText: `Ora: ${state.current.title}\n${elapsedBar(state.current.start_time, state.current.end_time, nowTime)} fino alle ${state.current.end_time}\n\nProssimo: ${state.next.title} alle ${state.next.start_time}`,
      };
  }
}
