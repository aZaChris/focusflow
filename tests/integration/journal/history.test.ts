import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against the linked Supabase project — longer than
// the default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 3 — reverse-chronological history, RLS scoping,
// empty state, and deletion.
const admin = adminClient();

async function signedInClient() {
  const email = `journal-history-${Date.now()}@example.com`;
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

describe('look back on past entries (Scenario 3)', () => {
  it('is empty for a brand-new user, not an error', async () => {
    const client = await signedInClient();
    const { data, error } = await client
      .from('journal_entries')
      .select('id, transcript')
      .order('created_at', { ascending: false });
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('lists entries reverse-chronologically and deletes one permanently', async () => {
    const client = await signedInClient();
    await client.from('journal_entries').insert({ transcript: 'First entry' });
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const { data: second } = await client
      .from('journal_entries')
      .insert({ transcript: 'Second entry' })
      .select()
      .single();

    const { data: history } = await client
      .from('journal_entries')
      .select('transcript')
      .order('created_at', { ascending: false });
    expect(history).toEqual([{ transcript: 'Second entry' }, { transcript: 'First entry' }]);

    const { error: deleteError } = await client.from('journal_entries').delete().eq('id', second!.id);
    expect(deleteError).toBeNull();

    const { data: afterDelete } = await client.from('journal_entries').select('transcript');
    expect(afterDelete).toEqual([{ transcript: 'First entry' }]);
  });

  it('does not return another user\'s entries', async () => {
    const clientA = await signedInClient();
    const clientB = await signedInClient();
    await clientA.from('journal_entries').insert({ transcript: 'Private to A' });

    const { data } = await clientB.from('journal_entries').select('transcript');
    expect(data).toEqual([]);
  });
});
