import { supabase } from '@/lib/supabase/client';
import { todayLocalDate, currentLocalTime } from '@/features/timeline/time';
import { getNowAndNext } from '@/features/timeline/nowNext';
import { toWidgetState, type WidgetState } from '@/features/widget/widgetState';
import { logEvent } from '@/lib/logging/logger';

// Shared by the home-screen widget (006) and the lock-screen notification
// (007) — both surfaces show the same now/next slice of today's activities,
// so they read it through the one query instead of each keeping their own.
export async function buildWidgetState(logEventName: string): Promise<WidgetState> {
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
    // Principle VI: a failed refresh is logged, not silently swallowed — and
    // rather than freeze on stale data, the surface shows "nothing to show"
    // until the next successful refresh (or the app itself) corrects it.
    logEvent(logEventName, 'failure', { detail: error.message });
    return toWidgetState({ hasSession: true, hasAnyActivitiesToday: false, current: null, next: null });
  }

  const activities = data ?? [];
  const { current, next } = getNowAndNext(activities, currentLocalTime());
  logEvent(logEventName, 'success');
  return toWidgetState({ hasSession: true, hasAnyActivitiesToday: activities.length > 0, current, next });
}
