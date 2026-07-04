import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against a local Deno/Postgres stack — longer than the
// default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 6 — confirm-and-delete → cascade verified in the DB →
// post-delete sign-in fails identically to a never-registered email (FR-009, FR-012).
const FUNCTIONS_URL = `${API_URL}/functions/v1/account-delete`;

const admin = adminClient();

describe('account deletion (Scenario 6)', () => {
  it('deletes the account, cascades personal data, and blocks future sign-in', async () => {
    const email = `delete-${Date.now()}@example.test`;
    const password = 'Passw0rd';
    const { data: created } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    const userId = created.user!.id;

    const client = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: signInData } = await client.auth.signInWithPassword({ email, password });
    const accessToken = signInData.session!.access_token;

    const res = await fetch(FUNCTIONS_URL, {
      method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'deleted' });

    // FR-009: cascade removes the profile row (and, transitively, anything FK'd to it).
    const { data: profileRows } = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId);
    expect(profileRows).toEqual([]);

    // FR-009/FR-012: the account is gone — sign-in fails exactly like an unregistered email.
    const { error: signInAfterDelete } = await createClient(API_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    }).auth.signInWithPassword({ email, password });
    expect(signInAfterDelete).not.toBeNull();
  });
});
