-- SCRIP DI SETUP DATABASE FOCUSFLOW
-- Da eseguire nel pannello SQL Editor di Supabase

-- 1. Tabella PROFILES (Estende auth.users)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  expo_push_token text,
  constraint username_length check (char_length(username) >= 3)
);

-- 2. Tabella HABITS (Abitudini e Task)
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  icon text default '✨',
  streak int default 0,
  is_completed boolean default false,
  scheduled_time time, -- HH:MM:SS
  duration_minutes int default 30,
  created_at timestamp with time zone default now()
);

-- 3. Tabella JOURNAL_ENTRIES (Diario Vocale e AI)
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  transcript text,
  ai_summary text,
  created_at timestamp with time zone default now()
);

-- 4. Tabella MOOD_LOGS (Umore ed Energia)
create table mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  mood_score int check (mood_score between 1 and 5),
  energy_score int check (energy_score between 1 and 5),
  created_at timestamp with time zone default now()
);

-- ABILITAZIONE RLS (Row Level Security)
alter table profiles enable row level security;
alter table habits enable row level security;
alter table journal_entries enable row level security;
alter table mood_logs enable row level security;

-- POLICY PER PROFILES
create policy "I profili sono visibili a tutti." on profiles for select using (true);
create policy "Gli utenti possono inserire il proprio profilo." on profiles for insert with check (auth.uid() = id);
create policy "Gli utenti possono aggiornare il proprio profilo." on profiles for update using (auth.uid() = id);

-- POLICY PER HABITS
create policy "Gli utenti vedono solo le proprie abitudini." on habits for select using (auth.uid() = user_id);
create policy "Gli utenti possono inserire le proprie abitudini." on habits for insert with check (auth.uid() = user_id);
create policy "Gli utenti possono aggiornare le proprie abitudini." on habits for update using (auth.uid() = user_id);
create policy "Gli utenti possono eliminare le proprie abitudini." on habits for delete using (auth.uid() = user_id);

-- POLICY PER JOURNAL_ENTRIES
create policy "Gli utenti vedono solo i propri diari." on journal_entries for select using (auth.uid() = user_id);
create policy "Gli utenti possono inserire i propri diari." on journal_entries for insert with check (auth.uid() = user_id);

-- POLICY PER MOOD_LOGS
create policy "Gli utenti vedono solo i propri mood log." on mood_logs for select using (auth.uid() = user_id);
create policy "Gli utenti possono inserire i propri mood log." on mood_logs for insert with check (auth.uid() = user_id);
