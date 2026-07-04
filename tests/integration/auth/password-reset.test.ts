import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against the Supabase project in .env — longer than the
// default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 3 — request reset → use link → sign in with new password →
// reused link rejected (FR-008) → non-enumeration for an unknown email (FR-012).
// Uses the admin generateLink API instead of reading a real inbox, so this runs the
// same against local Supabase or a hosted project (no SMTP/Mailpit needed).
// ponytail: the hosted free-tier project's default email sender has a very low
// per-hour rate limit, so `resetPasswordForEmail` (the real send path) is only called
// once below, in the non-enumeration test — add a custom SMTP provider if this suite
// needs to exercise it more.
const admin = adminClient();

function tokensFromRedirect(location: string) {
  const fragment = location.split('#')[1] ?? '';
  const params = new URLSearchParams(fragment);
  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    error: params.get('error'),
    errorDescription: params.get('error_description'),
  };
}

describe('password reset (Scenario 3)', () => {
  it('lets a user set a new password via the emailed link, then rejects reusing it', async () => {
    const email = `reset-${Date.now()}@example.com`;
    const oldPassword = 'Passw0rd';
    const newPassword = 'NewPass1';
    await admin.auth.admin.createUser({ email, password: oldPassword, email_confirm: true });

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });
    expect(linkError).toBeNull();
    const resetLink = linkData!.properties!.action_link;

    const firstUse = await fetch(resetLink, { redirect: 'manual' });
    const { accessToken, refreshToken } = tokensFromRedirect(firstUse.headers.get('location')!);
    expect(accessToken).toEqual(expect.any(String));

    const recoveryClient = createClient(API_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await recoveryClient.auth.setSession({ access_token: accessToken!, refresh_token: refreshToken! });
    const { error: updateError } = await recoveryClient.auth.updateUser({ password: newPassword });
    expect(updateError).toBeNull();

    const okSignIn = await createClient(API_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    }).auth.signInWithPassword({ email, password: newPassword });
    expect(okSignIn.error).toBeNull();

    const failedSignIn = await createClient(API_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    }).auth.signInWithPassword({ email, password: oldPassword });
    expect(failedSignIn.error).not.toBeNull();

    // FR-008: the same link cannot be used a second time.
    const secondUse = await fetch(resetLink, { redirect: 'manual' });
    const { error } = tokensFromRedirect(secondUse.headers.get('location')!);
    expect(error).toBe('access_denied');
  });

  it('responds identically for an unregistered email (FR-012)', async () => {
    const email = `no-such-reset-${Date.now()}@example.com`;
    const anon = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

    const { error } = await anon.auth.resetPasswordForEmail(email, {
      redirectTo: 'focusflow://reset-password',
    });
    expect(error).toBeNull();
  });
});
