import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against a local Deno/Postgres stack — longer than the
// default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 4 — sign-out ends the session immediately, on the server, not
// just in local app state (FR-006). The client-side redirect half is covered by the
// route-guard unit test (tests/unit/auth/routeGuard.test.ts) — rendering the full
// navigation tree here would test expo-router itself, not this feature's logic.
const admin = adminClient();

describe('sign-out (Scenario 4)', () => {
  it('clears the local session and revokes the refresh token server-side', async () => {
    const email = `signout-${Date.now()}@example.test`;
    const password = 'Passw0rd';
    await admin.auth.admin.createUser({ email, password, email_confirm: true });

    const client = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({ email, password });
    expect(signInError).toBeNull();
    const refreshToken = signInData.session!.refresh_token;

    const { error: signOutError } = await client.auth.signOut();
    expect(signOutError).toBeNull();

    const { data: afterSignOut } = await client.auth.getSession();
    expect(afterSignOut.session).toBeNull();

    // FR-006: the session ends on the server too, not just locally — the old refresh
    // token must not be usable to mint a new session.
    const freshClient = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error: refreshError } = await freshClient.auth.refreshSession({ refresh_token: refreshToken });
    expect(refreshError).not.toBeNull();
  });
});
