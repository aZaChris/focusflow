import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against the linked Supabase project (and, in turn,
// real OpenAI calls — research.md §4, a small real cost per run) — longer than
// the default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 1 — record → transcribe → the client inserts the row.
const FUNCTIONS_URL = `${API_URL}/functions/v1/journal-process`;
const admin = adminClient();

async function signedInClient() {
  const email = `journal-record-${Date.now()}@example.com`;
  const password = 'Passw0rd';
  await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const anon = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data } = await anon.auth.signInWithPassword({ email, password });
  const client = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  await client.auth.setSession({
    access_token: data.session!.access_token,
    refresh_token: data.session!.refresh_token,
  });
  return { client, accessToken: data.session!.access_token };
}

describe('speak instead of type (Scenario 1)', () => {
  it('transcribes a recording and the client persists it as a journal entry', async () => {
    const { client, accessToken } = await signedInClient();
    const audio = readFileSync(join(__dirname, '../../fixtures/journal-test-clip.m4a'));

    const form = new FormData();
    form.append('audio', new Blob([new Uint8Array(audio)], { type: 'audio/m4a' }), 'clip.m4a');
    const res = await fetch(FUNCTIONS_URL, {
      method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    expect(res.status).toBe(200);
    const { transcript, moodSummary, feedback } = await res.json();
    expect(transcript.length).toBeGreaterThan(0);

    const { data: inserted, error } = await client
      .from('journal_entries')
      .insert({ transcript, mood_summary: moodSummary, feedback })
      .select()
      .single();
    expect(error).toBeNull();
    expect(inserted!.transcript).toBe(transcript);
  });
});
