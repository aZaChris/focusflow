import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';

export type SignInResult =
  | { ok: true }
  | { ok: false; mfaRequired: true; factorId: string }
  | { ok: false; message: string };

const SIGNIN_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/auth-signin`;

// contracts/auth-contracts.md — client never calls auth.signInWithPassword directly;
// the auth-signin Edge Function enforces FR-011 lockout and FR-012 non-enumeration.
export function useSignIn() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn(email: string, password: string): Promise<SignInResult> {
    setIsSubmitting(true);
    try {
      const res = await fetch(SIGNIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
        },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();

      if (res.status === 429) {
        logEvent('sign_in', 'failure', { detail: 'locked' });
        return { ok: false, message: 'Too many attempts. Try again in 15 minutes.' };
      }

      if (body.status === 'mfa_required') {
        // FR-015: credentials are already confirmed correct (auth-signin just checked
        // them under lockout protection) — establish the local aal1 session directly so
        // the MFA-challenge screen can complete auth.mfa.challenge/verify itself, per
        // contracts/auth-contracts.md ("client then calls auth.mfa.challenge/verify
        // directly to complete sign-in").
        const { error: sessionError } = await supabase.auth.signInWithPassword({ email, password });
        if (sessionError) {
          logEvent('sign_in', 'failure', { detail: sessionError.message });
          return { ok: false, message: 'Unable to sign in right now. Please try again.' };
        }
        logEvent('sign_in', 'success', { detail: 'mfa_required' });
        return { ok: false, mfaRequired: true, factorId: body.factor_id };
      }

      if (body.status !== 'ok') {
        logEvent('sign_in', 'failure');
        return { ok: false, message: 'Incorrect email or password.' };
      }

      const { error } = await supabase.auth.setSession(body.session);
      if (error) {
        logEvent('sign_in', 'failure', { detail: error.message });
        return { ok: false, message: 'Unable to sign in right now. Please try again.' };
      }

      logEvent('sign_in', 'success');
      return { ok: true };
    } finally {
      setIsSubmitting(false);
    }
  }

  return { signIn, isSubmitting };
}
