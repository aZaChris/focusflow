# Test fixtures

## `journal-test-clip.m4a` (missing — add before running journal-process tests)

A few seconds of clear, discernible speech, used by
`tests/integration/journal/journal-process.test.ts` and
`tests/integration/journal/record-transcribe.test.ts` (see
`specs/005-ai-voice-journal/quickstart.md` Prerequisites).

No text-to-speech tool was available in the environment this was scaffolded in
(no `espeak`/`sox`/`ffmpeg`, no sudo to install one) to generate this
automatically. To add it:

- Record ~5 seconds of yourself saying something like "Today was a pretty good
  day, I got through my whole to-do list" on your phone, export as `.m4a`, and
  drop it here as `journal-test-clip.m4a`, **or**
- Once `OPENAI_API_KEY` is available, generate one via OpenAI's text-to-speech
  API and save the output here.

Keep it short — every test run that uses it makes a real, billed OpenAI call
(research.md §4).
