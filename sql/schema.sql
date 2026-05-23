
-- === SCHEMA FOR DFP PHASE 1 (Dark) ===
-- Create extension if not exists
create extension if not exists pgcrypto;

-- Profiles table (admin flag)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean default false,
  created_at timestamp with time zone default now()
);

-- Pool settings (lock toggle)
create table if not exists public.pool_settings (
  pool_type text primary key,
  is_locked boolean not null default false
);

-- Teams (team per pool per user; unique name within pool)
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pool_type text not null references public.pool_settings(pool_type) on delete restrict,
  name text not null,
  disabled boolean not null default false,
  created_at timestamp with time zone default now(),
  unique (pool_type, name)
);

-- Pool entries (reserved for future scoring; 1:1 with team for now)
create table if not exists public.pool_entries (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Seed pool settings for all pools (unlocked by default)
insert into public.pool_settings (pool_type, is_locked) values
  ('survivor', false),
  ('pick6', false),
  ('one-and-done', false),
  ('super-bowl', false),
  ('playoff-squares', false),
  ('weekly-pickem', false),
  ('stanley-cup', false),
  ('cfp-bracket', false),
  ('march-madness', false)
  on conflict (pool_type) do nothing;
