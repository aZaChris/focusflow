import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';

export type DeleteAccountResult = { ok: true } | { ok: false; message: string };

const DELETE_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/account-delete`;

// FR-009: permanent deletion, no soft-delete. Principle VI: a failure must be surfaced
// to the user with a retry option, never fail silently.
export function useDeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteAccount(): Promise<DeleteAccountResult> {
    setIsDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const accountId = sessionData.session?.user.id;

      const res = await fetch(DELETE_URL, {
        method: 'POST',
        headers: {
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const body = await res.json();

      if (body.status !== 'deleted') {
        logEvent('account_delete', 'failure', { accountId });
        return { ok: false, message: 'Unable to delete your account right now. Please try again.' };
      }

      logEvent('account_delete', 'success', { accountId });
      // The account no longer exists server-side — only clear local session state.
      await supabase.auth.signOut({ scope: 'local' });
      return { ok: true };
    } finally {
      setIsDeleting(false);
    }
  }

  return { deleteAccount, isDeleting };
}
