// js/scoring-engine.js
// Calculates fantasy points from Sleeper raw stats + your scoring_settings table

window.ScoringEngine = {

  // Load scoring settings from Supabase
  settings: null,

  async loadSettings() {
    const { data, error } = await sb.from('scoring_settings').select('*');
    if (error) { console.error('Failed to load scoring settings:', error); return; }
    this.settings = {};
    for (const row of (data || [])) {
      if (!this.settings[row.category]) this.settings[row.category] = {};
      this.settings[row.category][row.stat] = parseFloat(row.value) || 0;
    }
  },

  // Get a scoring value
  get(category, stat) {
    if (!this.settings) return 0;
    return (this.settings[category] && this.settings[category][stat]) || 0;
  },

  // Calculate fantasy points for a player
  calculate(position, stats) {
    if (!stats || !this.settings) return 0;
    let pts = 0;
    const s = stats;

    if (position === 'QB') {
      pts += (s.pass_yd || 0) * this.get('qb', 'pass_yd');
      pts += (s.pass_td || 0) * this.get('qb', 'pass_td');
      pts += (s.int || 0) * this.get('qb', 'int_thrown');
      pts += (s.fum_lost || 0) * this.get('qb', 'fum_lost');
      // rushing
      pts += (s.rush_yd || 0) * this.get('rb', 'rush_yd');
      pts += (s.rush_td || 0) * this.get('rb', 'rush_td');
    }

    if (position === 'RB') {
      pts += (s.rush_yd || 0) * this.get('rb', 'rush_yd');
      pts += (s.rush_td || 0) * this.get('rb', 'rush_td');
      pts += (s.rec || 0) * this.get('rb', 'rec');
      pts += (s.rec_yd || 0) * this.get('rb', 'rec_yd');
      pts += (s.rec_td || 0) * this.get('rb', 'rec_td');
      pts += (s.fum_lost || 0) * this.get('rb', 'fum_lost');
    }

    if (position === 'WR') {
      pts += (s.rec || 0) * this.get('wr', 'rec');
      pts += (s.rec_yd || 0) * this.get('wr', 'rec_yd');
      pts += (s.rec_td || 0) * this.get('wr', 'rec_td');
      pts += (s.rush_yd || 0) * this.get('wr', 'rush_yd') || 0;
      pts += (s.fum_lost || 0) * this.get('wr', 'fum_lost');
    }

    if (position === 'TE') {
      pts += (s.rec || 0) * this.get('te', 'rec');
      pts += (s.rec_yd || 0) * this.get('te', 'rec_yd');
      pts += (s.rec_td || 0) * this.get('te', 'rec_td');
      pts += (s.fum_lost || 0) * this.get('te', 'fum_lost');
    }

    if (position === 'FLEX') {
      // FLEX can be RB/WR/TE — use receiving/rushing stats
      pts += (s.rush_yd || 0) * this.get('rb', 'rush_yd');
      pts += (s.rush_td || 0) * this.get('rb', 'rush_td');
      pts += (s.rec || 0) * this.get('wr', 'rec');
      pts += (s.rec_yd || 0) * this.get('wr', 'rec_yd');
      pts += (s.rec_td || 0) * this.get('wr', 'rec_td');
      pts += (s.fum_lost || 0) * this.get('rb', 'fum_lost');
    }

  if (position === 'K') {
      // FG by distance tier
      pts += (s.fgm_0_19 || 0) * 10 * this.get('k', 'fg_per_yard');
      pts += (s.fgm_20_29 || 0) * 25 * this.get('k', 'fg_per_yard');
      pts += (s.fgm_30_39 || 0) * 35 * this.get('k', 'fg_per_yard');
      pts += (s.fgm_40_49 || 0) * 45 * this.get('k', 'fg_per_yard');
      pts += (s.fgm_50p || 0) * 55 * this.get('k', 'fg_per_yard');
      // PAT
      pts += (s.xpm || 0) * this.get('k', 'pat');
      pts += (s.xpmiss || 0) * this.get('k', 'pat_miss');
      // Missed FG penalties
      pts += (s.fgmiss_0_19 || 0) * this.get('k', 'fg_miss_0_19');
      pts += (s.fgmiss_20_29 || 0) * this.get('k', 'fg_miss_20_29');
      pts += (s.fgmiss_30_39 || 0) * this.get('k', 'fg_miss_30_39');
      pts += (s.fgmiss_40_49 || 0) * this.get('k', 'fg_miss_40_49');
      pts += (s.fgmiss_50p || 0) * this.get('k', 'fg_miss_50_plus');
    }

    if (position === 'DST') {
      pts += (s.sack || 0) * this.get('dst', 'sack');
      pts += (s.safe || 0) * this.get('dst', 'safety');
      pts += (s.def_td || 0) * this.get('dst', 'dst_td');
      pts += (s.st_td || 0) * this.get('dst', 'st_td');
      // Turnovers
      const turnovers = (s.int || 0) + (s.fum_rec || 0);
      pts += turnovers * this.get('dst', 'turnover');
      // Points allowed tiers
      const pa = s.pts_allow || 0;
      if (pa === 0) pts += this.get('dst', 'pa_0');
      else if (pa <= 6) pts += this.get('dst', 'pa_1_6');
      else if (pa <= 13) pts += this.get('dst', 'pa_7_13');
      else if (pa <= 20) pts += this.get('dst', 'pa_14_20');
      else if (pa <= 27) pts += this.get('dst', 'pa_21_27');
      else if (pa <= 34) pts += this.get('dst', 'pa_28_34');
      else pts += this.get('dst', 'pa_35_plus');
    }

    return Math.round(pts * 100) / 100; // round to 2 decimal places
  },

  // Fetch live stats from Sleeper for a given season type and week
  async fetchSleeperStats(seasonType, season, week) {
    try {
      const url = `https://api.sleeper.app/v1/stats/nfl/${seasonType}/${season}/${week}`;
      const res = await fetch(url);
      if (!res.ok) return {};
      return await res.json();
    } catch (e) {
      console.error('Failed to fetch Sleeper stats:', e);
      return {};
    }
  },

  // Main function: fetch stats + calculate + save to player_points
  async syncLiveScores(seasonType, season, week) {
    await this.loadSettings();

    // Get all active players from our DB
    const { data: players, error } = await sb
      .from('players')
      .select('id, full_name, position, team, external_id, sport')
      .eq('sport', 'nfl')
      .eq('is_active', true);

    if (error) { console.error('Failed to load players:', error); return 0; }

    // Fetch raw stats from Sleeper
    const sleeperStats = await this.fetchSleeperStats(seasonType, season, week);
    if (!sleeperStats || !Object.keys(sleeperStats).length) {
      console.warn('No Sleeper stats returned');
      return 0;
    }

    // Calculate points for each player
    let updated = 0;
    const upserts = [];


    for (const player of (players || [])) {
      if (!player.external_id) continue;
      const stats = sleeperStats[player.external_id];
      if (!stats) continue;

      const pts = this.calculate(player.position, stats);
      upserts.push({
        player_id: player.id,
        points: pts,
        season_type: seasonType,
        season: parseInt(season),
        week: parseInt(week),
      });
      updated++;
    }

    console.log('Sample upsert:', upserts[0]);
    console.log('Total to upsert:', upserts.length);

    // Save to player_points in batches
    if (upserts.length) {
      const BATCH = 100;
      for (let i = 0; i < upserts.length; i += BATCH) {
        const { error: upErr } = await sb
          .from('player_points')
          .upsert(upserts.slice(i, i + BATCH), { 
            onConflict: 'player_id,season_type,season,week' 
          });
        if (upErr) {
  console.error('Upsert error:', upErr);
  console.error('Sample row:', upserts[i]);
}
      }
    }

    return updated;
  }
};