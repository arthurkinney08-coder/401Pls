
-- Seed defaults for scoring_settings (values only)
-- QB
insert into public.scoring_settings(category, stat, value) values
 ('qb','pass_yd', 0.02),
 ('qb','pass_td', 6.0)
 on conflict (category, stat) do update set value = excluded.value;

-- RB/WR/TE (we treat flex via allowed_positions in roster_settings)
insert into public.scoring_settings(category, stat, value) values
 ('rb','rush_yd', 0.1), ('rb','rush_td', 6.0),
 ('wr','rec_yd', 0.1), ('wr','rec_td', 6.0),
 ('te','rec_yd', 0.1), ('te','rec_td', 6.0)
 on conflict (category, stat) do update set value = excluded.value;

-- Kicker
insert into public.scoring_settings(category, stat, value) values
 ('k','pat', 1.0),
 ('k','fg_per_yard', 0.1)
 on conflict (category, stat) do update set value = excluded.value;

-- Defense/Special Teams
insert into public.scoring_settings(category, stat, value) values
 ('dst','sack', 2.0),
 ('dst','turnover', 2.0),
 ('dst','safety', 2.0),
 ('dst','dst_td', 6.0),
 ('dst','st_td', 6.0),
 ('dst','pa_0', 10.0),
 ('dst','pa_1_6', 7.0),
 ('dst','pa_7_13', 4.0),
 ('dst','pa_14_20', 1.0),
 ('dst','pa_21_27', 0.0),
 ('dst','pa_28_34', -1.0),
 ('dst','pa_35_plus', -4.0)
 on conflict (category, stat) do update set value = excluded.value;
