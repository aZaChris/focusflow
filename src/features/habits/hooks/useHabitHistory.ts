import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';

// User Story 3: which of the last 7 days were completed for one habit.
export function useHabitHistory(habitId: string, asOf: string) {
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const start = new Date(asOf);
      start.setDate(start.getDate() - 6);
      const startDate = start.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('habit_completions')
        .select('completed_on')
        .eq('habit_id', habitId)
        .gte('completed_on', startDate)
        .lte('completed_on', asOf)
        .order('completed_on', { ascending: true });

      if (cancelled) return;
      if (error) {
        logEvent('habit_history', 'failure', { detail: error.message });
        return;
      }
      setCompletedDays((data ?? []).map((row) => row.completed_on));
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [habitId, asOf]);

  return { completedDays, isLoading };
}
