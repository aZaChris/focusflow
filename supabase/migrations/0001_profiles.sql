-- T007: profiles table + auto-create trigger
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  mfa_enabled boolean not null default false
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- T008: RLS — client may only read/update its own row, never insert/delete
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Table-level grants: local/cloud default denies API roles any access until granted
-- explicitly, independent of RLS policies above (config.toml `auto_expose_new_tables`).
grant select, update on public.profiles to authenticated;
grant select, update on public.profiles to service_role;
