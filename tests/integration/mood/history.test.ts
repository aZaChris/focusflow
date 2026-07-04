import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against the linked Supabase project — longer than the
// default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 3 — mood entry history ordering and empty state.
const admin = adminClient();

async function signedInClient() {
  const email = `mood-history-${Date.now()}@example.com`;
  const password = 'Passw0rd';
  await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const anon = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data } = await anon.auth.signInWithPassword({ email, password });
  const client = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  await client.auth.setSession({
    access_token: data.session!.access_token,
    refresh_token: data.session!.refresh_token,
  });
  return client;
}

describe('mood entry history (Scenario 3, User Story 3 Acceptance Scenario 2-3)', () => {
  it('is empty for a brand-new user, not an error', async () => {
    const client = await signedInClient();
    const { data, error } = await client
      .from('mood_entries')
      .select('id, mood_level, energy_level, created_at')
      .order('created_at', { ascending: false });
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('lists entries reverse-chronologically', async () => {
    const client = await signedInClient();
    await client.from('mood_entries').insert({ mood_level: 3, energy_level: 3 });
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await client.from('mood_entries').insert({ mood_level: 4, energy_level: 2 });

    const { data } = await client
      .from('mood_entries')
      .select('mood_level, energy_level')
      .order('created_at', { ascending: false });

    expect(data).toEqual([
      { mood_level: 4, energy_level: 2 },
      { mood_level: 3, energy_level: 3 },
    ]);
  });
});
