// contracts/journal-contracts.md — journal-process: the only server-side piece
// of this feature, and the only place OPENAI_API_KEY (a real secret, Principle
// VII) is ever read. Never touches Postgres (research.md §6) and never writes
// the uploaded audio anywhere — it's held in memory only for the duration of
// the OpenAI calls below, then discarded (FR-006, research.md §2).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MAX_AUDIO_BYTES = 8 * 1024 * 1024; // ~5 minutes of compressed audio (FR-013).
const TRANSCRIBE_MODEL = 'whisper-1';
const ANALYSIS_MODEL = 'gpt-4o-mini';

function log(event: string, outcome: 'success' | 'failure', detail?: string): void {
  // Principle IV/VI: event + outcome only — never transcript content or audio.
  console[outcome === 'failure' ? 'error' : 'log'](
    JSON.stringify({ event, outcome, detail, timestamp: new Date().toISOString() }),
  );
}

async function transcribeAudio(audio: Blob): Promise<string | null> {
  const form = new FormData();
  form.append('file', audio, 'entry.m4a');
  form.append('model', TRANSCRIBE_MODEL);

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}` },
    body: form,
  });
  if (!res.ok) {
    log('journal_transcribe', 'failure', `status_${res.status}`);
    return null;
  }
  const body = await res.json();
  const text = (body.text ?? '').trim();
  if (!text) {
    log('journal_transcribe', 'failure', 'empty_transcript');
    return null;
  }
  log('journal_transcribe', 'success');
  return text;
}

async function analyzeMood(transcript: string): Promise<{ moodSummary: string; feedback: string } | null> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ANALYSIS_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You read a short personal voice-journal transcript from someone who may have ADHD. ' +
            'Respond ONLY with a JSON object: {"moodSummary": "a few words naming the mood/emotional ' +
            'tone", "feedback": "one short, warm, non-judgmental, motivational sentence responding ' +
            'to what they said"}.',
        },
        { role: 'user', content: transcript },
      ],
    }),
  });
  if (!res.ok) {
    log('journal_analyze', 'failure', `status_${res.status}`);
    return null;
  }
  try {
    const body = await res.json();
    const parsed = JSON.parse(body.choices[0].message.content);
    if (!parsed.moodSummary || !parsed.feedback) throw new Error('missing fields');
    log('journal_analyze', 'success');
    return { moodSummary: parsed.moodSummary, feedback: parsed.feedback };
  } catch (error) {
    log('journal_analyze', 'failure', (error as Error).message);
    return null;
  }
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer /, '');

  // research.md §6: the anon key is enough to validate a caller's own JWT — no
  // service_role is needed anywhere in this feature.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData.user) {
    return Response.json({ status: 'error' }, { status: 401 });
  }

  const contentType = req.headers.get('Content-Type') ?? '';
  let transcript: string;

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const audio = form.get('audio');
    if (!(audio instanceof Blob)) {
      return Response.json({ status: 'error' }, { status: 400 });
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return Response.json({ status: 'too_long' }, { status: 413 });
    }
    const result = await transcribeAudio(audio);
    if (!result) {
      return Response.json({ status: 'transcription_failed' }, { status: 422 });
    }
    transcript = result;
  } else {
    const body = await req.json();
    if (!body.transcript) {
      return Response.json({ status: 'error' }, { status: 400 });
    }
    transcript = body.transcript;
  }

  const mood = await analyzeMood(transcript);
  return Response.json({
    transcript,
    moodSummary: mood?.moodSummary ?? null,
    feedback: mood?.feedback ?? null,
  });
});
