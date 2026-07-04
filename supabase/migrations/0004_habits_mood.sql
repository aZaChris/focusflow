-- T001: habits, habit_completions, mood_entries tables + profiles.mood_consent_at
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index habits_user_id_idx on public.habits (user_id);

create table public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  -- Denormalized from habits.user_id so RLS can check auth.uid() = user_id directly,
  -- without a subquery join into habits on every row (research.md §-, data-model.md).
  user_id uuid not null references auth.users (id) on delete cascade,
  completed_on date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, completed_on)
);

create index habit_completions_habit_id_idx on public.habit_completions (habit_id);
create index habit_completions_user_id_idx on public.habit_completions (user_id);

create table public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mood_level smallint not null check (mood_level between 1 and 5),
  energy_level smallint not null check (energy_level between 1 and 5),
  created_at timestamptz not null default now()
);

create index mood_entries_user_id_created_at_idx
  on public.mood_entries (user_id, created_at desc);

alter table public.profiles add column mood_consent_at timestamptz;

-- T002: RLS — every table scoped to auth.uid(), plus explicit grants (the
-- missing-grants bug hit during 001-user-auth: RLS and table-level GRANTs are two
-- separate gates, both required).
alter table public.habits enable row level security;

create policy "habits_select_own"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "habits_insert_own"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "habits_update_own"
  on public.habits for update
  using (auth.uid() = user_id);

-- No delete policy: archiving is an update (archived_at); row deletion only via the
-- auth.users cascade (FR-006, FR-011).

alter table public.habit_completions enable row level security;

create policy "habit_completions_select_own"
  on public.habit_completions for select
  using (auth.uid() = user_id);

create policy "habit_completions_insert_own"
  on public.habit_completions for insert
  with check (auth.uid() = user_id);

create policy "habit_completions_delete_own"
  on public.habit_completions for delete
  using (auth.uid() = user_id);

-- No update policy: a completion is either present or absent (insert/delete only);
-- idempotent same-day completion uses `on conflict (habit_id, completed_on) do
-- nothing`, which needs no update privilege at all.

alter table public.mood_entries enable row level security;

create policy "mood_entries_select_own"
  on public.mood_entries for select
  using (auth.uid() = user_id);

create policy "mood_entries_insert_own"
  on public.mood_entries for insert
  with check (auth.uid() = user_id);

-- No update/delete policy: mood entries are an append-only log by design (FR-008,
-- data-model.md — no backfilling/editing in v1).

-- Table-level grants: local/cloud default denies API roles any access until granted
-- explicitly, independent of the RLS policies above. No service_role grant on any
-- of these tables — this feature has no Edge Functions and never uses service_role
-- (research.md §3).
grant select, insert, update on public.habits to authenticated;
grant select, insert, delete on public.habit_completions to authenticated;
grant select, insert on public.mood_entries to authenticated;

-- T003: get_habits(p_as_of) — streak computed at read time, never stored (research.md
-- §1/§2). security invoker (not definer): relies entirely on the RLS policies above,
-- so it can never be used to read across users or bypass RLS.
create or replace function public.get_habits(p_as_of date)
returns table (
  id uuid,
  title text,
  created_at timestamptz,
  current_streak int,
  longest_streak int
)
language sql
security invoker
stable
set search_path = public
as $$
  with my_habits as (
    select h.id, h.title, h.created_at
    from public.habits h
    where h.user_id = auth.uid() and h.archived_at is null
  ),
  completions as (
    select hc.habit_id, hc.completed_on
    from public.habit_completions hc
    join my_habits mh on mh.id = hc.habit_id
  ),
  -- Classic gaps-and-islands: subtracting an incrementing row number (ordered by
  -- date) from each date collapses every run of consecutive days onto one constant
  -- key, so grouping by (habit_id, island_key) yields one row per consecutive run.
  islands as (
    select
      habit_id,
      completed_on,
      completed_on - (row_number() over (partition by habit_id order by completed_on))::int as island_key
    from completions
  ),
  runs as (
    select habit_id, island_key, count(*) as run_length, max(completed_on) as run_end
    from islands
    group by habit_id, island_key
  ),
  longest as (
    select habit_id, max(run_length) as longest_streak
    from runs
    group by habit_id
  ),
  -- A run only counts as the *current* streak if it reaches yesterday or today
  -- (device-local, from p_as_of) — otherwise the streak is broken (FR-004).
  current_run as (
    select habit_id, run_length as current_streak
    from runs
    where run_end between p_as_of - 1 and p_as_of
  )
  select
    mh.id,
    mh.title,
    mh.created_at,
    coalesce(cur.current_streak, 0) as current_streak,
    coalesce(lng.longest_streak, 0) as longest_streak
  from my_habits mh
  left join current_run cur on cur.habit_id = mh.id
  left join longest lng on lng.habit_id = mh.id;
$$;

grant execute on function public.get_habits(date) to authenticated;
