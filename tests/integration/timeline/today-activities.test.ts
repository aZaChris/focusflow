import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against the linked Supabase project — longer than the
// default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 1 — activities are scoped to a single activity_date and
// to the authenticated caller.
const admin = adminClient();

async function signedInClient() {
  const email = `today-activities-${Date.now()}@example.com`;
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

describe('activities are scoped to a day and to their owner', () => {
  it('only returns rows for the requested activity_date', async () => {
    const client = await signedInClient();
    await client.from('activities').insert({ title: 'Yesterday thing', activity_date: '2026-07-03', start_time: '09:00', end_time: '10:00' });
    await client.from('activities').insert({ title: 'Today thing', activity_date: '2026-07-04', start_time: '09:00', end_time: '10:00' });

    const { data, error } = await client
      .from('activities')
      .select('title')
      .eq('activity_date', '2026-07-04')
      .order('start_time', { ascending: true });

    expect(error).toBeNull();
    expect(data).toEqual([{ title: 'Today thing' }]);
  });

  it('does not return another user\'s activities', async () => {
    const clientA = await signedInClient();
    const clientB = await signedInClient();
    await clientA.from('activities').insert({ title: 'Mine', activity_date: '2026-07-04', start_time: '09:00', end_time: '10:00' });

    const { data } = await clientB
      .from('activities')
      .select('title')
      .eq('activity_date', '2026-07-04');

    expect(data).toEqual([]);
  });
});
