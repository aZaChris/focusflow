import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import Purchases from 'react-native-purchases';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';

// research.md §2 (004-subscription-monetization): RevenueCat's App User ID is
// kept equal to our own auth.uid(), so entitlement follows the account, not the
// device — Purchases.logIn/logOut mirror Supabase's own sign-in/sign-out exactly.
async function syncPurchasesIdentity(newSession: Session | null): Promise<void> {
  if (newSession) {
    await Purchases.logIn(newSession.user.id);
  } else {
    await Purchases.logOut();
  }
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
      syncPurchasesIdentity(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      syncPurchasesIdentity(newSession);
    });

    // FR-005: 30-day rolling session — supabase-js only auto-refreshes the token while
    // this timer is running, so it must pause/resume with the app's foreground state
    // (backgrounded JS timers don't fire); each active-foreground refresh is what resets
    // GoTrue's `inactivity_timeout` clock (config.toml [auth.sessions]).
    if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      subscription.subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    logEvent('sign_out', error ? 'failure' : 'success', {
      accountId: session?.user.id,
      detail: error?.message,
    });
  }

  return { session, isLoading, signOut };
}
