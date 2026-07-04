-- T002: journal_entries — transcript + mood analysis only, deliberately no audio
-- column: raw audio is never persisted anywhere (FR-006, research.md §2).
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  transcript text not null,
  mood_summary text,
  feedback text,
  created_at timestamptz not null default now()
);

create index journal_entries_user_id_created_at_idx
  on public.journal_entries (user_id, created_at desc);

alter table public.journal_entries enable row level security;

create policy "journal_entries_select_own"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "journal_entries_insert_own"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "journal_entries_update_own"
  on public.journal_entries for update
  using (auth.uid() = user_id);

create policy "journal_entries_delete_own"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

-- Table-level grant: local/cloud default denies API roles any access until granted
-- explicitly, independent of the RLS policies above. No service_role grant — this
-- feature's Edge Function never touches Postgres at all (research.md §6).
grant select, insert, update, delete on public.journal_entries to authenticated;
