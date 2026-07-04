-- T044: mfa_backup_codes — hashes only, never plaintext (FR-016, data-model.md).
create table public.mfa_backup_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index mfa_backup_codes_user_id_idx on public.mfa_backup_codes (user_id);

alter table public.mfa_backup_codes enable row level security;

create policy "mfa_backup_codes_select_own"
  on public.mfa_backup_codes for select
  using (auth.uid() = user_id);

-- Column-level grant: the client may see whether a code is used/unused, but never
-- `code_hash` — this is enforced at the privilege layer, not just by convention.
-- All insert/update happen only via `security definer` Edge Functions (service_role).
grant select (id, used_at, created_at) on public.mfa_backup_codes to authenticated;
grant select, insert, update, delete on public.mfa_backup_codes to service_role;
