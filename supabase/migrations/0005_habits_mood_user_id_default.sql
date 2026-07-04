-- Follow-up to T001: default user_id to auth.uid() so client inserts don't need to
-- fetch and pass their own id explicitly. RLS still enforces auth.uid() = user_id if
-- a caller supplies a different value, so this only removes boilerplate, not security.
alter table public.habits alter column user_id set default auth.uid();
alter table public.habit_completions alter column user_id set default auth.uid();
alter table public.mood_entries alter column user_id set default auth.uid();
