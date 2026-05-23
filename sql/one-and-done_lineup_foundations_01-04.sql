
-- DFP One & Done — Lineup Foundations (O1–O4)
-- Safe to run in Supabase SQL editor. Idempotent where possible.
--
-- CONTENTS
--  O1  Tables: lineup_entries, lineup_usage
--  O2  Table:  player_points
--  O3  Views:  v_team_round_points, v_od_leaderboard
--  O4  RLS:    round_locked() helper + policies for lineup_* and player_points

-- =====================
-- O1) LINEUP TABLES
-- =====================
create table if not exists public.lineup_entries (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  round_id uuid not null references public.playoff_rounds(id) on delete cascade,
  position text not null check (position in ('QB','RB','WR','TE','FLEX','K','DST')),
  player_id uuid not null references public.players(id),
  inserted_at timestamptz not null default now(),
  unique (team_id, round_id, position)
);

create table if not exists public.lineup_usage (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id),
  unique (team_id, player_id)
);

-- =====================
-- O2) PLAYER POINTS (MVP FEED)
-- =====================
create table if not exists public.player_points (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  window_id uuid not null references public.round_time_windows(id),
  points numeric not null default 0,
  unique (player_id, window_id)
);

-- =====================
-- O3) VIEWS FOR TOTALS
-- =====================
create or replace view public.v_team_round_points as
select
  le.team_id,
  le.round_id,
  sum(coalesce(pp.points,0))::numeric as round_points
from public.lineup_entries le
join public.players p on p.id = le.player_id
left join public.player_points pp
       on pp.player_id = p.id
      and pp.window_id = p.time_window_id
group by le.team_id, le.round_id;

create or replace view public.v_od_leaderboard as
select
  t.id   as team_id,
  t.name as team_name,
  sum(coalesce(v.round_points,0))::numeric as total_points
from public.teams t
left join public.v_team_round_points v
       on v.team_id = t.id
where t.pool_type = 'one-and-done'
group by t.id, t.name
order by total_points desc, team_name asc;

-- =====================
-- O4) RLS & LOCKING
-- =====================
-- Helper: a round is locked once the earliest window for that round has started.
create or replace function public.round_locked(_round_id uuid)
returns boolean language sql stable as $$
  select coalesce(
    (select now() >= min(start_at_utc)
       from public.round_time_windows
      where round_id = _round_id),
    false
  );
$$;

-- Enable RLS
alter table public.lineup_entries enable row level security;
alter table public.lineup_usage  enable row level security;
alter table public.player_points enable row level security;

-- READ policies
create policy if not exists lineup_entries_read on public.lineup_entries
for select using (
  exists (
    select 1 from public.teams t
     where t.id = lineup_entries.team_id
       and (t.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

create policy if not exists lineup_usage_read on public.lineup_usage
for select using (
  exists (
    select 1 from public.teams t
     where t.id = lineup_usage.team_id
       and (t.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

create policy if not exists player_points_read on public.player_points
for select using (true);

-- WRITE policies
-- Owners can write their lineup entries only if round is not locked; admin can always write.
create policy if not exists lineup_entries_write on public.lineup_entries
for all using (
  exists (
    select 1 from public.teams t
     where t.id = lineup_entries.team_id
       and (
         public.is_admin(auth.uid())
         or (t.user_id = auth.uid() and not public.round_locked(lineup_entries.round_id))
       )
  )
) with check (
  exists (
    select 1 from public.teams t
     where t.id = lineup_entries.team_id
       and (
         public.is_admin(auth.uid())
         or (t.user_id = auth.uid() and not public.round_locked(lineup_entries.round_id))
       )
  )
);

-- Owners (or admin) can write usage rows; usage has no time dependency (enforced by entries flow)
create policy if not exists lineup_usage_write on public.lineup_usage
for all using (
  exists (
    select 1 from public.teams t
     where t.id = lineup_usage.team_id
       and (t.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
) with check (
  exists (
    select 1 from public.teams t
     where t.id = lineup_usage.team_id
       and (t.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

-- Admin-only write for player_points (manual entry now; later automated by Edge Function)
create policy if not exists player_points_admin on public.player_points
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Indexes (optional but recommended)
create index if not exists idx_lineup_entries_team_round on public.lineup_entries(team_id, round_id);
create index if not exists idx_lineup_entries_player on public.lineup_entries(player_id);
create index if not exists idx_lineup_usage_team on public.lineup_usage(team_id);
create index if not exists idx_player_points_window on public.player_points(window_id);
