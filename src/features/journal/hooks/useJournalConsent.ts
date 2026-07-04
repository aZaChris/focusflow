import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';

// FR-005: one-time consent, naming the AI provider, before the first recording
// is ever processed — same pattern as 002-habit-mood-tracking's useMoodConsent.
export function useJournalConsent() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase
        .from('profiles')
        .select('journal_consent_at')
        .eq('id', userData.user.id)
        .single();
      setHasConsented(!!data?.journal_consent_at);
    })();
  }, []);

  async function giveConsent() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { ok: false };
    const { error } = await supabase
      .from('profiles')
      .update({ journal_consent_at: new Date().toISOString() })
      .eq('id', userData.user.id);
    logEvent('journal_consent', error ? 'failure' : 'success', { detail: error?.message });
    if (!error) setHasConsented(true);
    return { ok: !error };
  }

  return { hasConsented, giveConsent };
}
