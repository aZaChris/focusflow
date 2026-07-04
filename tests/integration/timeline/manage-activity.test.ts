import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against the linked Supabase project — longer than the
// default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 3 — edit and delete an existing activity.
const admin = adminClient();

async function signedInClient() {
  const email = `manage-activity-${Date.now()}@example.com`;
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

describe('manage activities (Scenario 3)', () => {
  it('persists an edit to an existing activity', async () => {
    const client = await signedInClient();
    const { data: created } = await client
      .from('activities')
      .insert({ title: 'Team standup', activity_date: '2026-07-04', start_time: '09:00', end_time: '09:30' })
      .select()
      .single();

    const { error } = await client.from('activities').update({ end_time: '09:45' }).eq('id', created!.id);
    expect(error).toBeNull();

    const { data: after } = await client.from('activities').select('end_time').eq('id', created!.id).single();
    expect(after!.end_time).toBe('09:45:00');
  });

  it('removes the row when an activity is deleted', async () => {
    const client = await signedInClient();
    const { data: created } = await client
      .from('activities')
      .insert({ title: 'Deep work', activity_date: '2026-07-04', start_time: '10:00', end_time: '11:00' })
      .select()
      .single();

    const { error } = await client.from('activities').delete().eq('id', created!.id);
    expect(error).toBeNull();

    const { data: after } = await client.from('activities').select('id').eq('id', created!.id);
    expect(after).toEqual([]);
  });
});
