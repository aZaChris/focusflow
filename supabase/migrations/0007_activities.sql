-- T001: activities — timeline scheduled activities (data-model.md).
-- activity_date + start_time/end_time (not timestamptz) so "same calendar day" is
-- true by construction and never depends on server-side timezone inference
-- (research.md §2, same pattern as habit_completions.completed_on).
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  activity_date date not null,
  start_time time not null,
  end_time time not null check (end_time > start_time),
  created_at timestamptz not null default now()
);

create index activities_user_id_activity_date_idx
  on public.activities (user_id, activity_date, start_time);

-- No unique constraint: overlapping activities are explicitly allowed (FR-010).

alter table public.activities enable row level security;

create policy "activities_select_own"
  on public.activities for select
  using (auth.uid() = user_id);

create policy "activities_insert_own"
  on public.activities for insert
  with check (auth.uid() = user_id);

create policy "activities_update_own"
  on public.activities for update
  using (auth.uid() = user_id);

create policy "activities_delete_own"
  on public.activities for delete
  using (auth.uid() = user_id);

-- Table-level grant: local/cloud default denies API roles any access until granted
-- explicitly, independent of the RLS policies above. No service_role grant — this
-- feature has no Edge Functions and never uses service_role (research.md §3).
grant select, insert, update, delete on public.activities to authenticated;
