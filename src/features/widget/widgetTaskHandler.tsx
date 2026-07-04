import { type WidgetTaskHandlerProps } from 'react-native-android-widget';
import { supabase } from '@/lib/supabase/client';
import { todayLocalDate, currentLocalTime } from '@/features/timeline/time';
import { getNowAndNext } from '@/features/timeline/nowNext';
import { toWidgetState } from '@/features/widget/widgetState';
import { NowNextWidget } from '@/features/widget/NowNextWidget';
import { logEvent } from '@/lib/logging/logger';

// research.md §2/§3: no new backend, no new now/next logic — reads the same
// `activities` table and reuses 003-timeline-visualization's getNowAndNext.
async function buildWidgetState() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return toWidgetState({ hasSession: false, hasAnyActivitiesToday: false, current: null, next: null });
  }

  const today = todayLocalDate();
  const { data, error } = await supabase
    .from('activities')
    .select('id, title, activity_date, start_time, end_time')
    .eq('activity_date', today)
    .order('start_time', { ascending: true });

  if (error) {
    // FR-009/Principle VI: a failed refresh is logged, not silently swallowed —
    // and rather than freeze on stale data, the widget shows "nothing to show"
    // until the next successful refresh (or the app itself) corrects it.
    logEvent('widget_refresh', 'failure', { detail: error.message });
    return toWidgetState({ hasSession: true, hasAnyActivitiesToday: false, current: null, next: null });
  }

  const activities = data ?? [];
  const { current, next } = getNowAndNext(activities, currentLocalTime());
  logEvent('widget_refresh', 'success');
  return toWidgetState({ hasSession: true, hasAnyActivitiesToday: activities.length > 0, current, next });
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const state = await buildWidgetState();
      props.renderWidget(<NowNextWidget state={state} />);
      break;
    }
    default:
      break;
  }
}
