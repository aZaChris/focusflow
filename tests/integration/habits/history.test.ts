import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against the linked Supabase project — longer than the
// default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 3 — habit completion history for the last 7 days.
const admin = adminClient();

async function signedInClient() {
  const email = `habit-history-${Date.now()}@example.com`;
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

describe('habit completion history (Scenario 3, User Story 3 Acceptance Scenario 1)', () => {
  it('shows which of the last 7 days were completed', async () => {
    const client = await signedInClient();
    const { data: habit } = await client.from('habits').insert({ title: 'Journal' }).select().single();

    // Complete 3 of the last 7 days (2026-06-29..2026-07-05), skipping the rest.
    for (const day of ['2026-06-29', '2026-07-01', '2026-07-05']) {
      await client.from('habit_completions').insert({ habit_id: habit!.id, completed_on: day });
    }

    const { data: history, error } = await client
      .from('habit_completions')
      .select('completed_on')
      .eq('habit_id', habit!.id)
      .gte('completed_on', '2026-06-29')
      .lte('completed_on', '2026-07-05')
      .order('completed_on', { ascending: true });

    expect(error).toBeNull();
    expect(history!.map((r) => r.completed_on)).toEqual(['2026-06-29', '2026-07-01', '2026-07-05']);
  });
});
