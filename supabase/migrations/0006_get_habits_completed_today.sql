-- Follow-up to T003/FR-005: the habit list needs "completed today" at a glance,
-- which the original get_habits didn't expose. Recreated (not a new function) since
-- the return signature changes.
drop function if exists public.get_habits(date);

create or replace function public.get_habits(p_as_of date)
returns table (
  id uuid,
  title text,
  created_at timestamptz,
  current_streak int,
  longest_streak int,
  completed_today boolean
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
  current_run as (
    select habit_id, run_length as current_streak
    from runs
    where run_end between p_as_of - 1 and p_as_of
  ),
  today as (
    select distinct habit_id from completions where completed_on = p_as_of
  )
  select
    mh.id,
    mh.title,
    mh.created_at,
    coalesce(cur.current_streak, 0) as current_streak,
    coalesce(lng.longest_streak, 0) as longest_streak,
    (today.habit_id is not null) as completed_today
  from my_habits mh
  left join current_run cur on cur.habit_id = mh.id
  left join longest lng on lng.habit_id = mh.id
  left join today on today.habit_id = mh.id;
$$;

grant execute on function public.get_habits(date) to authenticated;
