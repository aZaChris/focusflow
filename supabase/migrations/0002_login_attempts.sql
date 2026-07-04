-- T023: login_attempts — server-side only (FR-011 lockout), no client access at all.
create table public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  attempted_at timestamptz not null default now(),
  success boolean not null
);

create index login_attempts_email_attempted_at_idx
  on public.login_attempts (email, attempted_at desc);

-- RLS enabled with zero policies: blocks anon/authenticated entirely; only the
-- service-role key (used inside the auth-signin Edge Function) can read/write.
alter table public.login_attempts enable row level security;

-- Table-level grant: local/cloud default denies API roles any access until granted
-- explicitly, independent of the RLS lockdown above (config.toml `auto_expose_new_tables`).
grant select, insert on public.login_attempts to service_role;
