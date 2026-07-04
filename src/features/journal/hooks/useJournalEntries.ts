import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';
import type { JournalProcessResult } from '@/features/journal/hooks/useJournalRecorder';

export interface JournalEntry {
  id: string;
  transcript: string;
  mood_summary: string | null;
  feedback: string | null;
  created_at: string;
}

const FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/journal-process`;

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, transcript, mood_summary, feedback, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      logEvent('journal_list', 'failure', { detail: error.message });
      return;
    }
    setEntries(data ?? []);
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  // FR-002/FR-004: a row is only ever created once journal-process has already
  // returned a transcript (data-model.md) — mood fields may still be null.
  async function saveEntry(result: JournalProcessResult) {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ transcript: result.transcript, mood_summary: result.moodSummary, feedback: result.feedback })
      .select()
      .single();
    logEvent('journal_save', error ? 'failure' : 'success', { detail: error?.message });
    if (!error) await refresh();
    return { ok: !error, entry: data as JournalEntry | undefined };
  }

  // FR-009/User Story 2 Acceptance Scenario 2: retries only the mood-analysis
  // step, from the transcript already saved — no re-recording needed.
  async function retryMoodAnalysis(entry: JournalEntry) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    try {
      const res = await fetch(FUNCTIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ transcript: entry.transcript }),
      });
      if (!res.ok) {
        logEvent('journal_mood_retry', 'failure', { detail: `status_${res.status}` });
        return { ok: false, message: "Couldn't analyze that entry. Please try again." };
      }
      const { moodSummary, feedback } = await res.json();
      const { error } = await supabase
        .from('journal_entries')
        .update({ mood_summary: moodSummary, feedback })
        .eq('id', entry.id);
      logEvent('journal_mood_retry', error ? 'failure' : 'success', { detail: error?.message });
      if (!error) await refresh();
      return { ok: !error };
    } catch (error) {
      logEvent('journal_mood_retry', 'failure', { detail: (error as Error).message });
      return { ok: false, message: 'Network error — please check your connection and try again.' };
    }
  }

  // FR-008
  async function deleteEntry(entryId: string) {
    const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
    logEvent('journal_delete', error ? 'failure' : 'success', { detail: error?.message });
    if (!error) await refresh();
    return { ok: !error };
  }

  return { entries, isLoading, refresh, saveEntry, retryMoodAnalysis, deleteEntry };
}
