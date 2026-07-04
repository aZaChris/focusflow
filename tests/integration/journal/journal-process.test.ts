import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips against the linked Supabase project (and, in turn,
// real OpenAI calls — research.md §4, a small real cost per run) — longer than
// the default 5s per-test budget.
jest.setTimeout(30000);

// contracts/journal-contracts.md — journal-process: audio in / transcript-only
// retry in, transcript + mood out.
const FUNCTIONS_URL = `${API_URL}/functions/v1/journal-process`;
const admin = adminClient();

async function signedInAccessToken() {
  const email = `journal-process-${Date.now()}@example.com`;
  const password = 'Passw0rd';
  await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const anon = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data } = await anon.auth.signInWithPassword({ email, password });
  return data.session!.access_token;
}

function testAudioFile(): Buffer {
  // A few seconds of clear speech, checked into the repo for this exact purpose
  // (quickstart.md Prerequisites) — kept intentionally short/cheap to transcribe.
  return readFileSync(join(__dirname, '../../fixtures/journal-test-clip.m4a'));
}

describe('journal-process contract', () => {
  it('transcribes short test audio and returns a mood analysis', async () => {
    const accessToken = await signedInAccessToken();
    const form = new FormData();
    form.append('audio', new Blob([new Uint8Array(testAudioFile())], { type: 'audio/m4a' }), 'clip.m4a');

    const res = await fetch(FUNCTIONS_URL, {
      method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(typeof body.transcript).toBe('string');
    expect(body.transcript.length).toBeGreaterThan(0);
    expect(typeof body.moodSummary === 'string' || body.moodSummary === null).toBe(true);
    expect(typeof body.feedback === 'string' || body.feedback === null).toBe(true);
  });

  it('retries mood analysis only when given a transcript instead of audio', async () => {
    const accessToken = await signedInAccessToken();
    const res = await fetch(FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ transcript: 'Today was a pretty good day, I got through my whole to-do list.' }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.transcript).toBe('Today was a pretty good day, I got through my whole to-do list.');
    expect(typeof body.moodSummary).toBe('string');
    expect(typeof body.feedback).toBe('string');
  });

  it('rejects an unauthenticated request', async () => {
    const form = new FormData();
    form.append('audio', new Blob([new Uint8Array(testAudioFile())], { type: 'audio/m4a' }), 'clip.m4a');

    const res = await fetch(FUNCTIONS_URL, {
      method: 'POST',
      headers: { apikey: ANON_KEY },
      body: form,
    });
    expect(res.status).toBe(401);
  });
});
