
-- Seed defaults for roster_settings (safe to run multiple times)
-- Wipe only these positions and insert defaults
begin;
  delete from public.roster_settings where position in ('QB','RB','WR','TE','FLEX','K','DST');
  insert into public.roster_settings (position, quantity, is_flex, allowed_positions) values
    ('QB',   1, false, null),
    ('RB',   2, false, null),
    ('WR',   2, false, null),
    ('TE',   1, false, null),
    ('FLEX', 1, true,  array['RB','WR','TE']),
    ('K',    1, false, null),
    ('DST',  1, false, null);
commit;
