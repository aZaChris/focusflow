import { createClient } from '@supabase/supabase-js';
import { generateTotp } from '../../helpers/totp';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips (TOTP enrollment, two Edge Function calls, a re-auth
// challenge) — longer than the default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 5 — enable 2FA → mfa_required on sign-in → redeem a backup
// code (single-use, FR-016) → re-authenticate → disable 2FA (FR-017).
const SIGNIN_URL = `${API_URL}/functions/v1/auth-signin`;
const GENERATE_URL = `${API_URL}/functions/v1/mfa-backup-codes-generate`;
const REDEEM_URL = `${API_URL}/functions/v1/mfa-backup-codes-redeem`;

const admin = adminClient();

async function callSignIn(email: string, password: string) {
  const res = await fetch(SIGNIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ email, password }),
  });
  return { status: res.status, body: await res.json() };
}

describe('two-factor authentication (Scenario 5)', () => {
  it('gates sign-in behind a second factor, accepts a backup code once, then requires re-auth to disable', async () => {
    const email = `mfa-${Date.now()}@example.test`;
    const password = 'Passw0rd';
    await admin.auth.admin.createUser({ email, password, email_confirm: true });

    const client = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: initialSignIn } = await client.auth.signInWithPassword({ email, password });

    // Enable 2FA: enroll + verify a TOTP factor (User Story 6, Acceptance Scenario 1).
    const { data: enrollData } = await client.auth.mfa.enroll({ factorType: 'totp' });
    const factorId = enrollData!.id;
    const secret = enrollData!.totp.secret;
    const { data: enrollChallenge } = await client.auth.mfa.challenge({ factorId });
    const { error: enrollVerifyError } = await client.auth.mfa.verify({
      factorId,
      challengeId: enrollChallenge!.id,
      code: generateTotp(secret),
    });
    expect(enrollVerifyError).toBeNull();

    // Backup codes are issued once, as plaintext (FR-016).
    const genRes = await fetch(GENERATE_URL, {
      method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${initialSignIn.session!.access_token}` },
    });
    const { codes } = await genRes.json();
    expect(codes).toHaveLength(10);

    // FR-015: sign-in now requires the second factor instead of returning a session.
    const gated = await callSignIn(email, password);
    expect(gated.body.status).toBe('mfa_required');
    expect(gated.body.factor_id).toBe(factorId);

    // Complete sign-in with a backup code instead of the TOTP app (Acceptance Scenario 3).
    const redeemRes = await fetch(REDEEM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ email, password, backup_code: codes[0] }),
    });
    const redeemBody = await redeemRes.json();
    expect(redeemBody.status).toBe('ok');

    // FR-016: that same backup code is now spent.
    const reuseRes = await fetch(REDEEM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ email, password, backup_code: codes[0] }),
    });
    expect((await reuseRes.json()).status).toBe('invalid_backup_code');

    // FR-017/Acceptance Scenario 4: disabling requires re-authenticating first — the
    // redeemed session is only aal1 (our backup-code path isn't Supabase's own MFA
    // system), so unenroll must fail until a fresh TOTP challenge elevates it to aal2.
    const postRedeemClient = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    await postRedeemClient.auth.setSession({
      access_token: redeemBody.session.access_token,
      refresh_token: redeemBody.session.refresh_token,
    });

    const unenrollBeforeReauth = await postRedeemClient.auth.mfa.unenroll({ factorId });
    expect(unenrollBeforeReauth.error).not.toBeNull();

    const { data: reauthChallenge } = await postRedeemClient.auth.mfa.challenge({ factorId });
    const { error: reauthVerifyError } = await postRedeemClient.auth.mfa.verify({
      factorId,
      challengeId: reauthChallenge!.id,
      code: generateTotp(secret),
    });
    expect(reauthVerifyError).toBeNull();

    const unenrollAfterReauth = await postRedeemClient.auth.mfa.unenroll({ factorId });
    expect(unenrollAfterReauth.error).toBeNull();
  });
});
