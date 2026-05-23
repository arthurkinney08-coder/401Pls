
-- Phase 2: Offense turnovers + Kicker misses (penalties)
-- Idempotent UPSERTs

-- Offense: interceptions thrown & fumbles lost (QB/RB/WR/TE)
insert into public.scoring_settings (category, stat, value) values
  ('qb','int_thrown', -2.0),
  ('qb','fum_lost',  -2.0),
  ('rb','int_thrown', -2.0),
  ('rb','fum_lost',  -2.0),
  ('wr','int_thrown', -2.0),
  ('wr','fum_lost',  -2.0),
  ('te','int_thrown', -2.0),
  ('te','fum_lost',  -2.0)
ON CONFLICT (category, stat) DO UPDATE SET value = EXCLUDED.value;

-- Kicker: missed extra point
insert into public.scoring_settings (category, stat, value) values
  ('k','pat_miss', -1.0)
ON CONFLICT (category, stat) DO UPDATE SET value = EXCLUDED.value;

-- Kicker: missed field goal tiers
insert into public.scoring_settings (category, stat, value) values
  ('k','fg_miss_0_19',  -5.0),
  ('k','fg_miss_20_29', -4.0),
  ('k','fg_miss_30_39', -3.0),
  ('k','fg_miss_40_49', -2.0),
  ('k','fg_miss_50_plus', -1.0)
ON CONFLICT (category, stat) DO UPDATE SET value = EXCLUDED.value;
