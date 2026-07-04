import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';
import { todayLocalDate } from '@/features/timeline/time';

export interface Activity {
  id: string;
  title: string;
  activity_date: string;
  start_time: string;
  end_time: string;
}

export function useTodayActivities(activityDate: string = todayLocalDate()) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('id, title, activity_date, start_time, end_time')
      .eq('activity_date', activityDate)
      .order('start_time', { ascending: true });
    if (error) {
      logEvent('activity_list', 'failure', { detail: error.message });
      return;
    }
    // Postgres returns time columns as "HH:MM:SS" — normalize to "HH:MM" so every
    // comparison against currentLocalTime()/nowNext.ts uses one consistent format.
    setActivities((data ?? []).map((row) => ({ ...row, start_time: row.start_time.slice(0, 5), end_time: row.end_time.slice(0, 5) })));
  }, [activityDate]);

  useEffect(() => {
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  async function createActivity(title: string, startTime: string, endTime: string) {
    const { error } = await supabase
      .from('activities')
      .insert({ title, activity_date: activityDate, start_time: startTime, end_time: endTime });
    logEvent('activity_create', error ? 'failure' : 'success', { detail: error?.message });
    if (!error) await refresh();
    return { ok: !error };
  }

  async function updateActivity(
    activityId: string,
    changes: Partial<Pick<Activity, 'title' | 'start_time' | 'end_time'>>,
  ) {
    const { error } = await supabase.from('activities').update(changes).eq('id', activityId);
    logEvent('activity_update', error ? 'failure' : 'success', { detail: error?.message });
    if (!error) await refresh();
    return { ok: !error };
  }

  async function deleteActivity(activityId: string) {
    const { error } = await supabase.from('activities').delete().eq('id', activityId);
    logEvent('activity_delete', error ? 'failure' : 'success', { detail: error?.message });
    if (!error) await refresh();
    return { ok: !error };
  }

  return { activities, isLoading, refresh, createActivity, updateActivity, deleteActivity };
}
