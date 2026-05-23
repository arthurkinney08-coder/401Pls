
-- Phase 2: Quick PPR update (0.5 per reception)
-- Safe to run multiple times. Adds/updates receptions scoring for WR/RB/TE.
-- Table: public.scoring_settings (category, stat, value)

-- WR receptions
insert into public.scoring_settings (category, stat, value)
values ('wr','rec', 0.5)
on conflict (category, stat) do update set value = excluded.value;

-- RB receptions
insert into public.scoring_settings (category, stat, value)
values ('rb','rec', 0.5)
on conflict (category, stat) do update set value = excluded.value;

-- TE receptions
insert into public.scoring_settings (category, stat, value)
values ('te','rec', 0.5)
on conflict (category, stat) do update set value = excluded.value;

-- Optional: set qb/dst receptions explicitly to 0, if you want to be explicit
insert into public.scoring_settings (category, stat, value)
values ('qb','rec', 0.0)
on conflict (category, stat) do update set value = excluded.value;

insert into public.scoring_settings (category, stat, value)
values ('dst','rec', 0.0)
on conflict (category, stat) do update set value = excluded.value;
