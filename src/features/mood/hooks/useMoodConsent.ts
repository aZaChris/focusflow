import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';

// FR-012: one-time consent before the first mood/energy entry is ever collected.
export function useMoodConsent() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase
        .from('profiles')
        .select('mood_consent_at')
        .eq('id', userData.user.id)
        .single();
      setHasConsented(!!data?.mood_consent_at);
    })();
  }, []);

  async function giveConsent() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { ok: false };
    const { error } = await supabase
      .from('profiles')
      .update({ mood_consent_at: new Date().toISOString() })
      .eq('id', userData.user.id);
    logEvent('mood_consent', error ? 'failure' : 'success', { detail: error?.message });
    if (!error) setHasConsented(true);
    return { ok: !error };
  }

  return { hasConsented, giveConsent };
}
