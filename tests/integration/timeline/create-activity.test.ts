import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against the linked Supabase project — longer than the
// default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 2 — create activities, overlaps allowed, invalid rejected.
const admin = adminClient();

async function signedInClient() {
  const email = `create-activity-${Date.now()}@example.com`;
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

describe('create scheduled activities (Scenario 2)', () => {
  it('persists a new activity with the given title/time range', async () => {
    const client = await signedInClient();
    const { data, error } = await client
      .from('activities')
      .insert({ title: 'Team standup', activity_date: '2026-07-04', start_time: '09:00', end_time: '09:30' })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data).toMatchObject({ title: 'Team standup', start_time: '09:00:00', end_time: '09:30:00' });
  });

  it('allows two overlapping activities on the same day', async () => {
    const client = await signedInClient();
    const first = await client.from('activities').insert({ title: 'Team standup', activity_date: '2026-07-04', start_time: '09:00', end_time: '09:30' });
    const second = await client.from('activities').insert({ title: 'Deep work', activity_date: '2026-07-04', start_time: '09:15', end_time: '11:00' });
    expect(first.error).toBeNull();
    expect(second.error).toBeNull();

    const { data } = await client.from('activities').select('title').eq('activity_date', '2026-07-04').order('start_time');
    expect(data).toEqual([{ title: 'Team standup' }, { title: 'Deep work' }]);
  });

  it('rejects an end_time before start_time at the database layer (FR-009)', async () => {
    const client = await signedInClient();
    const { error } = await client
      .from('activities')
      .insert({ title: 'Bad activity', activity_date: '2026-07-04', start_time: '10:00', end_time: '09:00' });
    expect(error).not.toBeNull();
  });
});
