import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';

export interface DayConsistency {
  date: string;
  completedCount: number;
}

// Handoff (Habits screen): "Weekly consistency" card — 7 bars, one per day,
// height% = fraction of habits completed that day. No new backend: reuses
// the same habit_completions rows useHabitHistory already reads, aggregated
// across all of the caller's habits instead of just one.
export function useWeeklyConsistency(habitIds: string[], asOf: string) {
  const [days, setDays] = useState<DayConsistency[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (habitIds.length === 0) {
      setDays(
        Array.from({ length: 7 }, (_, i) => {
          const d = new Date(asOf);
          d.setDate(d.getDate() - (6 - i));
          return { date: d.toISOString().slice(0, 10), completedCount: 0 };
        }),
      );
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const start = new Date(asOf);
      start.setDate(start.getDate() - 6);
      const startDate = start.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('habit_completions')
        .select('completed_on')
        .in('habit_id', habitIds)
        .gte('completed_on', startDate)
        .lte('completed_on', asOf);

      if (cancelled) return;
      if (error) {
        logEvent('habit_weekly_consistency', 'failure', { detail: error.message });
        setIsLoading(false);
        return;
      }

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        counts.set(row.completed_on, (counts.get(row.completed_on) ?? 0) + 1);
      }
      const result: DayConsistency[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const date = d.toISOString().slice(0, 10);
        return { date, completedCount: counts.get(date) ?? 0 };
      });
      setDays(result);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [habitIds.join(','), asOf]);

  return { days, isLoading };
}
