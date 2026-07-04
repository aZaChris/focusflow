import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';

export interface Habit {
  id: string;
  title: string;
  created_at: string;
  current_streak: number;
  longest_streak: number;
  completed_today: boolean;
}

// research.md §2: the device's local calendar day, never the server's — passed
// explicitly to get_habits rather than letting the database infer "today".
function todayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_habits', { p_as_of: todayLocalDate() });
    if (error) {
      logEvent('habit_list', 'failure', { detail: error.message });
      return;
    }
    setHabits(data ?? []);
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  async function createHabit(title: string) {
    const { error } = await supabase.from('habits').insert({ title });
    logEvent('habit_create', error ? 'failure' : 'success', { detail: error?.message });
    if (!error) await refresh();
    return { ok: !error };
  }

  async function archiveHabit(habitId: string) {
    const { error } = await supabase
      .from('habits')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', habitId);
    logEvent('habit_archive', error ? 'failure' : 'success', { detail: error?.message });
    if (!error) await refresh();
    return { ok: !error };
  }

  return { habits, isLoading, refresh, createHabit, archiveHabit, todayLocalDate };
}
