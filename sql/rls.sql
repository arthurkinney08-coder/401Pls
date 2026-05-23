
-- === SECURITY (RLS) ===

-- Helper: is_admin(uid)
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- Helper: pool_locked(pool_type)
create or replace function public.pool_locked(p text)
returns boolean language sql stable as $$
  select coalesce((select is_locked 
                   from public.pool_settings 
                   where pool_type = p), true);
$$;

-- Enable RLS on all relevant tables
alter table public.profiles enable row level security;
alter table public.pool_settings enable row level security;
alter table public.teams enable row level security;
alter table public.pool_entries enable row level security;

-- =======================
-- PROFILES POLICIES
-- =======================

-- Users can read their own profile OR admin can read any profile
create policy profiles_self_read on public.profiles
    for select
    using ( id = auth.uid() or public.is_admin(auth.uid()) );

-- Only admin can update profiles
create policy profiles_admin_update on public.profiles
    for update
    using ( public.is_admin(auth.uid()) );

-- When a user row is inserted, it must match their own id
create policy profiles_insert_self on public.profiles
    for insert
    with check ( id = auth.uid() );


-- =======================
-- POOL_SETTINGS POLICIES
-- =======================

-- Anyone can read pool settings
create policy pool_settings_read on public.pool_settings
    for select using ( true );

-- Only admin can update pool settings (lock/unlock)
create policy pool_settings_admin_update on public.pool_settings
    for update
    using ( public.is_admin(auth.uid()) );


-- =======================
-- TEAMS POLICIES
-- =======================

-- Users can read their own teams. Admin can read all.
create policy teams_read_policy on public.teams
    for select
    using ( user_id = auth.uid() or public.is_admin(auth.uid()) );

-- Users can insert (create) teams only if pool is NOT locked
create policy teams_insert_policy on public.teams
    for insert
    with check (
        auth.uid() = user_id
        and not public.pool_locked(pool_type)
    );

-- Users can update (rename) only their own teams, only if unlocked.
-- Admin can update any time.
create policy teams_update_policy on public.teams
    for update
    using (
        (user_id = auth.uid() and not public.pool_locked(pool_type))
        or public.is_admin(auth.uid())
    );

-- Users can delete their own teams only if pool is unlocked.
-- Admin can delete any time.
create policy teams_delete_policy on public.teams
    for delete
    using (
        (user_id = auth.uid() and not public.pool_locked(pool_type))
        or public.is_admin(auth.uid())
    );


-- =======================
-- POOL ENTRIES (future use)
-- Admin-only for now
-- =======================

create policy pool_entries_admin_all on public.pool_entries
    for all
    using ( public.is_admin(auth.uid()) )
    with check ( public.is_admin(auth.uid()) );
