import { useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';
import { signUpSchema } from '@/features/auth/validation/schemas';

export type SignUpResult = { ok: true } | { ok: false; message: string };

// FR-012: always resolve the same way for a fresh vs. already-registered email — Supabase
// signals a duplicate via an empty `identities` array on success (no error, no new email
// sent), so the UI never has a "this email exists" branch to leak from.
export function useSignUp() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signUp(email: string, password: string): Promise<SignUpResult> {
    const parsed = signUpSchema.safeParse({ email, password });
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid email or password' };
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: Linking.createURL('/verify') },
      });

      if (error) {
        logEvent('sign_up', 'failure', { detail: error.message });
        return { ok: false, message: 'Unable to register right now. Please try again.' };
      }

      const isDuplicate = data.user?.identities?.length === 0;
      logEvent('sign_up', 'success', {
        accountId: data.user?.id,
        detail: isDuplicate ? 'duplicate_email' : undefined,
      });
      return { ok: true };
    } finally {
      setIsSubmitting(false);
    }
  }

  return { signUp, isSubmitting };
}
