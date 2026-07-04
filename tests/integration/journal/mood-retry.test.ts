import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against the linked Supabase project (and, in turn,
// real OpenAI calls — research.md §4, a small real cost per run) — longer than
// the default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 2 — mood analysis retried from an existing transcript,
// independent of the original recording (User Story 2, Acceptance Scenario 2).
const FUNCTIONS_URL = `${API_URL}/functions/v1/journal-process`;
const admin = adminClient();

async function signedInClient() {
  const email = `journal-mood-retry-${Date.now()}@example.com`;
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

describe('get a mood reflection — retry path (Scenario 2)', () => {
  it('fills in mood_summary/feedback on an existing transcript-only row', async () => {
    const { client, accessToken } = await signedInClient();

    // Simulates a row saved after transcription succeeded but mood analysis
    // failed (data-model.md: mood_summary/feedback null until retried).
    const { data: created } = await client
      .from('journal_entries')
      .insert({ transcript: 'I felt a bit overwhelmed today but I got through it.' })
      .select()
      .single();
    expect(created!.mood_summary).toBeNull();

    const res = await fetch(FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ transcript: created!.transcript }),
    });
    expect(res.status).toBe(200);
    const { moodSummary, feedback } = await res.json();
    expect(typeof moodSummary).toBe('string');
    expect(typeof feedback).toBe('string');

    const { error: updateError } = await client
      .from('journal_entries')
      .update({ mood_summary: moodSummary, feedback })
      .eq('id', created!.id);
    expect(updateError).toBeNull();

    const { data: after } = await client
      .from('journal_entries')
      .select('mood_summary, feedback')
      .eq('id', created!.id)
      .single();
    expect(after!.mood_summary).toBe(moodSummary);
  });
});
