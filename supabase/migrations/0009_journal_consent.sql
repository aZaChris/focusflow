-- FR-005: one-time, explicit consent (naming the AI provider client-side) before
-- the first recording is ever processed — same pattern as 002's mood_consent_at.
alter table public.profiles add column journal_consent_at timestamptz;
