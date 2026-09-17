import { supabase } from '@/lib/supabase/client';
import { todayLocalDate, currentLocalTime } from '@/features/timeline/time';
import { getNowAndNext } from '@/features/timeline/nowNext';
import { toWidgetState, type WidgetState } from '@/features/widget/widgetState';
import { logEvent } from '@/lib/logging/logger';

// research.md §4 (007-lockscreen-timeline): extracted from 006-now-next-widget's
// private buildWidgetState so both the home-screen widget and the lock-screen
// notification derive current/next from one place and never disagree.
export async function buildNowNextState(): Promise<WidgetState> {
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
    // FR-011/Principle VI: a failed refresh is logged, not silently swallowed —
    // and rather than freeze on stale data, callers show "nothing to show"
    // until the next successful refresh (or the app itself) corrects it.
    logEvent('now_next_refresh', 'failure', { detail: error.message });
    return toWidgetState({ hasSession: true, hasAnyActivitiesToday: false, current: null, next: null });
  }

  const activities = data ?? [];
  const { current, next } = getNowAndNext(activities, currentLocalTime());
  logEvent('now_next_refresh', 'success');
  return toWidgetState({ hasSession: true, hasAnyActivitiesToday: activities.length > 0, current, next });
}
