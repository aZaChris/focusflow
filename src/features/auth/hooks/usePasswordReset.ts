import { useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';
import { passwordSchema } from '@/features/auth/validation/schemas';

export type PasswordResetResult = { ok: true } | { ok: false; message: string };

// FR-007/FR-008/FR-012: requestReset always resolves the same way regardless of whether
// the email is registered — Supabase's own resetPasswordForEmail never reveals that
// distinction (no error, silently no-op for an unknown email).
export function usePasswordReset() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestReset(email: string): Promise<PasswordResetResult> {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Linking.createURL('/reset-password'),
      });
      logEvent('password_reset_request', error ? 'failure' : 'success', {
        detail: error?.message,
      });
      return { ok: true };
    } finally {
      setIsSubmitting(false);
    }
  }

  async function setNewPassword(newPassword: string): Promise<PasswordResetResult> {
    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid password' };
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      logEvent('password_reset_complete', error ? 'failure' : 'success', {
        accountId: data.user?.id,
        detail: error?.message,
      });
      if (error) {
        return { ok: false, message: 'Unable to reset your password. Please request a new link.' };
      }
      return { ok: true };
    } finally {
      setIsSubmitting(false);
    }
  }

  return { requestReset, setNewPassword, isSubmitting };
}
