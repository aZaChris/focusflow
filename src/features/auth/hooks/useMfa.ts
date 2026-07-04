import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';

export type MfaResult = { ok: true } | { ok: false; message: string };

const GENERATE_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/mfa-backup-codes-generate`;
const REDEEM_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/mfa-backup-codes-redeem`;

// FR-014–FR-017: TOTP enrollment/challenge/verify/unenroll are Supabase Auth built-ins
// (contracts/auth-contracts.md); backup codes are this feature's one custom piece.
export function useMfa() {
  const [isBusy, setIsBusy] = useState(false);

  async function enroll() {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const, factorId: data.id, secret: data.totp.secret, uri: data.totp.uri };
  }

  async function verifyFactor(factorId: string, code: string): Promise<MfaResult> {
    setIsBusy(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) return { ok: false, message: challengeError.message };

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) return { ok: false, message: 'Invalid code. Please try again.' };
      return { ok: true };
    } finally {
      setIsBusy(false);
    }
  }

  // FR-016: plaintext codes are only ever available in this one response.
  async function generateBackupCodes(): Promise<{ ok: true; codes: string[] } | { ok: false; message: string }> {
    const { data: sessionData } = await supabase.auth.getSession();
    const res = await fetch(GENERATE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
    });
    const body = await res.json();
    if (body.status === 'error') {
      return { ok: false, message: 'Unable to generate backup codes. Please try again.' };
    }
    return { ok: true, codes: body.codes };
  }

  async function redeemBackupCode(email: string, password: string, backupCode: string): Promise<MfaResult> {
    const res = await fetch(REDEEM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
      },
      body: JSON.stringify({ email, password, backup_code: backupCode }),
    });
    const body = await res.json();
    if (body.status !== 'ok') {
      logEvent('mfa_backup_code_redeem', 'failure');
      return { ok: false, message: 'That backup code is invalid or already used.' };
    }
    const { error } = await supabase.auth.setSession(body.session);
    if (error) return { ok: false, message: 'Unable to sign in right now. Please try again.' };
    logEvent('mfa_backup_code_redeem', 'success');
    return { ok: true };
  }

  // FR-017/Acceptance Scenario 4: require a fresh proof of the second factor — Supabase
  // rejects `mfa.unenroll` unless the current session is already at aal2, so a stale
  // (non-MFA-established) session must re-verify before it can disable 2FA.
  async function disableMfa(factorId: string, code: string): Promise<MfaResult> {
    setIsBusy(true);
    try {
      const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (level?.currentLevel !== 'aal2') {
        const reauth = await verifyFactor(factorId, code);
        if (!reauth.ok) return reauth;
      }

      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) return { ok: false, message: 'Unable to disable 2FA. Please try again.' };
      logEvent('mfa_disable', 'success');
      return { ok: true };
    } finally {
      setIsBusy(false);
    }
  }

  return { enroll, verifyFactor, generateBackupCodes, redeemBackupCode, disableMfa, isBusy };
}
