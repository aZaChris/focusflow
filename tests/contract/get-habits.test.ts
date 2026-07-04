import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../helpers/env';

// Real network round-trips against the linked Supabase project — longer than the
// default 5s per-test budget.
jest.setTimeout(30000);

// contracts/habit-mood-contracts.md — get_habits RPC.
const admin = adminClient();

async function signedInClient(email: string, password: string) {
  const anon = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const client = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  await client.auth.setSession({
    access_token: data.session!.access_token,
    refresh_token: data.session!.refresh_token,
  });
  return client;
}

async function newTestUser() {
  const email = `get-habits-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'Passw0rd';
  await admin.auth.admin.createUser({ email, password, email_confirm: true });
  return signedInClient(email, password);
}

describe('get_habits contract', () => {
  it('returns an empty array for a user with no habits', async () => {
    const client = await newTestUser();
    const { data, error } = await client.rpc('get_habits', { p_as_of: '2026-07-04' });
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('increments current_streak for consecutive completed days', async () => {
    const client = await newTestUser();
    const { data: habit, error: habitError } = await client.from('habits').insert({ title: 'Drink water' }).select().single();
    expect(habitError).toBeNull();

    for (const day of ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04']) {
      const { error } = await client.from('habit_completions').insert({ habit_id: habit!.id, completed_on: day });
      expect(error).toBeNull();
    }

    const { data } = await client.rpc('get_habits', { p_as_of: '2026-07-04' });
    expect(data![0].current_streak).toBe(4);
    expect(data![0].longest_streak).toBe(4);
  });

  it('resets current_streak to 0 after a missed day but preserves longest_streak', async () => {
    const client = await newTestUser();
    const { data: habit } = await client.from('habits').insert({ title: 'Stretch' }).select().single();

    for (const day of ['2026-06-01', '2026-06-02', '2026-06-03']) {
      await client.from('habit_completions').insert({ habit_id: habit!.id, completed_on: day });
    }
    // Gap: nothing logged on 2026-06-04 or 2026-06-05.

    const { data } = await client.rpc('get_habits', { p_as_of: '2026-06-05' });
    expect(data![0].current_streak).toBe(0);
    expect(data![0].longest_streak).toBe(3);
  });

  it('does not double-count a same-day completion inserted twice (idempotent upsert)', async () => {
    const client = await newTestUser();
    const { data: habit } = await client.from('habits').insert({ title: 'Read' }).select().single();

    const row = { habit_id: habit!.id, completed_on: '2026-07-04' };
    await client.from('habit_completions').upsert(row, { onConflict: 'habit_id,completed_on', ignoreDuplicates: true });
    await client.from('habit_completions').upsert(row, { onConflict: 'habit_id,completed_on', ignoreDuplicates: true });

    const { count } = await client
      .from('habit_completions')
      .select('id', { count: 'exact', head: true })
      .eq('habit_id', habit!.id);
    expect(count).toBe(1);

    const { data } = await client.rpc('get_habits', { p_as_of: '2026-07-04' });
    expect(data![0].current_streak).toBe(1);
  });
});
