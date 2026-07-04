import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against the linked Supabase project — longer than the
// default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 2 — first-run consent gate, then independent mood entries.
const admin = adminClient();

async function signedInClient() {
  const email = `mood-log-${Date.now()}@example.com`;
  const password = 'Passw0rd';
  await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const anon = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data } = await anon.auth.signInWithPassword({ email, password });
  const client = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  await client.auth.setSession({
    access_token: data.session!.access_token,
    refresh_token: data.session!.refresh_token,
  });
  return { client, userId: data.user!.id };
}

describe('capture how I am feeling right now (Scenario 2)', () => {
  it('has no consent yet for a brand-new user', async () => {
    const { client, userId } = await signedInClient();
    const { data: profile } = await client.from('profiles').select('mood_consent_at').eq('id', userId).single();
    expect(profile!.mood_consent_at).toBeNull();
  });

  it('records consent once, then logs independent same-day entries with no daily limit', async () => {
    const { client, userId } = await signedInClient();

    // FR-012: one-time consent, set before any mood entry is collected.
    const { error: consentError } = await client
      .from('profiles')
      .update({ mood_consent_at: new Date().toISOString() })
      .eq('id', userId);
    expect(consentError).toBeNull();

    const first = await client.from('mood_entries').insert({ mood_level: 4, energy_level: 3 });
    expect(first.error).toBeNull();
    const second = await client.from('mood_entries').insert({ mood_level: 2, energy_level: 2 });
    expect(second.error).toBeNull();

    const { data: entries } = await client
      .from('mood_entries')
      .select('mood_level, energy_level')
      .order('created_at', { ascending: true });
    expect(entries).toHaveLength(2);
    expect(entries).toEqual([
      { mood_level: 4, energy_level: 3 },
      { mood_level: 2, energy_level: 2 },
    ]);
  });

  it('rejects a mood_level outside 1-5 at the database boundary', async () => {
    const { client } = await signedInClient();
    const { error } = await client.from('mood_entries').insert({ mood_level: 9, energy_level: 3 });
    expect(error).not.toBeNull();
  });
});
