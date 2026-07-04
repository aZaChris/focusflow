import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against the Supabase project in .env — longer than the
// default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 1 — sign-up → verification link → blocked-until-verified →
// verified access. Uses the admin generateLink API instead of reading a real inbox, so
// this runs the same against local Supabase or a hosted project (no SMTP/Mailpit needed).
const admin = adminClient();

function testClient() {
  return createClient(API_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

describe('sign-up and verify (Scenario 1)', () => {
  it('blocks access until the verification link is followed, then grants it', async () => {
    const email = `signup-${Date.now()}@example.test`;
    const password = 'Passw0rd';

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
    });
    expect(linkError).toBeNull();

    const client = testClient();
    // FR-003/FR-013: unverified account must not be allowed to sign in yet.
    const blockedSignIn = await client.auth.signInWithPassword({ email, password });
    expect(blockedSignIn.error).not.toBeNull();

    const verifyResponse = await fetch(linkData!.properties!.action_link, { redirect: 'manual' });
    expect([200, 302, 303]).toContain(verifyResponse.status);

    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
      email,
      password,
    });
    expect(signInError).toBeNull();
    expect(signInData.user?.email_confirmed_at).toBeTruthy();
  });
});
