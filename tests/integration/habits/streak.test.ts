import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against the linked Supabase project — longer than the
// default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 1 — create a habit, build a streak, miss a day, undo.
const admin = adminClient();

async function signedInClient() {
  const email = `habit-streak-${Date.now()}@example.com`;
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

describe('build a daily habit and see it stick (Scenario 1)', () => {
  it('creates a habit, builds a streak, resets after a missed day, then undoes a completion', async () => {
    const client = await signedInClient();

    // Step 1: create a habit — starts at 0/0 (User Story 1, Acceptance Scenario 1).
    const { data: habit, error: createError } = await client
      .from('habits')
      .insert({ title: 'Drink water' })
      .select()
      .single();
    expect(createError).toBeNull();

    const { data: freshList } = await client.rpc('get_habits', { p_as_of: '2026-07-01' });
    expect(freshList![0]).toMatchObject({ current_streak: 0, longest_streak: 0 });

    // Step 2: mark complete for 4 consecutive days — streak becomes 4 (Acceptance Scenario 2).
    for (const day of ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04']) {
      const { error } = await client.from('habit_completions').insert({ habit_id: habit!.id, completed_on: day });
      expect(error).toBeNull();
    }
    const { data: afterStreak } = await client.rpc('get_habits', { p_as_of: '2026-07-04' });
    expect(afterStreak![0]).toMatchObject({ current_streak: 4, longest_streak: 4 });

    // Step 3: a day passes with no completion — current streak resets to 0, longest
    // streak is preserved (Acceptance Scenario 3, FR-004).
    const { data: afterGap } = await client.rpc('get_habits', { p_as_of: '2026-07-06' });
    expect(afterGap![0]).toMatchObject({ current_streak: 0, longest_streak: 4 });

    // Step 4: undo today's completion — the row disappears and the streak reflects
    // it (Acceptance Scenario 4).
    await client.from('habit_completions').insert({ habit_id: habit!.id, completed_on: '2026-07-06' });
    const { data: afterRecomplete } = await client.rpc('get_habits', { p_as_of: '2026-07-06' });
    expect(afterRecomplete![0].current_streak).toBe(1);

    const { error: undoError } = await client
      .from('habit_completions')
      .delete()
      .match({ habit_id: habit!.id, completed_on: '2026-07-06' });
    expect(undoError).toBeNull();

    const { data: afterUndo } = await client.rpc('get_habits', { p_as_of: '2026-07-06' });
    expect(afterUndo![0].current_streak).toBe(0);
  });
});
