import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';

export interface MoodEntry {
  id: string;
  mood_level: number;
  energy_level: number;
  created_at: string;
}

// FR-007/FR-009: append-only log, no daily limit, read back reverse-chronologically.
export function useMoodEntries() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('mood_entries')
      .select('id, mood_level, energy_level, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      // FR-013/Principle IV: never log the mood/energy values themselves.
      logEvent('mood_list', 'failure', { detail: error.message });
      return;
    }
    setEntries(data ?? []);
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  async function logMoodEntry(moodLevel: number, energyLevel: number) {
    const { error } = await supabase
      .from('mood_entries')
      .insert({ mood_level: moodLevel, energy_level: energyLevel });
    // FR-013/Principle IV: outcome only, never the mood/energy values.
    logEvent('mood_log', error ? 'failure' : 'success', { detail: error?.message });
    if (!error) await refresh();
    return { ok: !error };
  }

  return { entries, isLoading, refresh, logMoodEntry };
}
