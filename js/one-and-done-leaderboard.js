<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  // If you already create the client elsewhere, remove these two lines
  const supabaseUrl = window.SUPABASE_URL;
  const supabaseKey = window.SUPABASE_ANON_KEY;
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  // Get current pool_id (either set on window or parsed from URL)
  const poolId = window.CURRENT_POOL_ID || new URLSearchParams(location.search).get('pool_id');

  // 1) Fetch leaderboard teams (team + total points). Replace this with your real source.
  // If you already have a SQL view for totals, point to it here.
  async function fetchLeaderboardTeams() {
    // Example if you have a view named one_and_done_leaderboard:
    // const { data, error } = await supabase
    //   .from('one_and_done_leaderboard')
    //   .select('team_id, team_name, total_points')
    //   .eq('pool_id', poolId)
    //   .order('total_points', { ascending: false });

    // TEMP fallback: pull fantasy teams in the pool, compute total_points 0 for now
    const { data, error } = await supabase
      .from('fantasy_teams')
      .select('id, team_name')
      .eq('pool_id', poolId)
      .order('team_name', { ascending: true });

    if (error) {
      console.error('fetchLeaderboardTeams error', error);
      return [];
    }
    return (data || []).map(r => ({
      team_id: r.id,
      team_name: r.team_name,
      total_points: 0
    }));
  }

  // 2) Fetch *played* lineup rows for a given team
  async function fetchPlayedLineups(teamId) {
    // Preferred: use the view that pre-filters has_played=true
    const { data, error } = await supabase
      .from('one_and_done_lineups_played')
      .select('*')
      .eq('pool_id', poolId)
      .eq('team_id', teamId)
      .order('week', { ascending: true })
      .order('game_date', { ascending: true });

    if (error) {
      console.error('fetchPlayedLineups error', error);
      return [];
    }
    return data || [];
  }

  // 3) Render leaderboard rows with an expander and a hidden detail row
  function renderLeaderboardRow(row) {
    const tr = document.createElement('tr');
    tr.dataset.teamId = row.team_id;

    const tdExpand = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'expander-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', `Expand ${row.team_name} lineups`);
    btn.textContent = '+';
    btn.addEventListener('click', () => toggleDetail(tr, btn, row));
    tdExpand.appendChild(btn);

    const tdTeam = document.createElement('td');
    tdTeam.textContent = row.team_name;

    const tdPts = document.createElement('td');
    tdPts.className = 'has-text-right';
    tdPts.textContent = Number(row.total_points || 0).toFixed(2);

    tr.append(tdExpand, tdTeam, tdPts);

    const detailTr = document.createElement('tr');
    detailTr.className = 'detail-row';
    detailTr.hidden = true;
    detailTr.dataset.detailFor = row.team_id;

    const detailTd = document.createElement('td');
    detailTd.colSpan = 3;
    detailTd.innerHTML = `
      <div class="lineup-group">
        <div class="week-title muted">Loading lineup…</div>
      </div>`;
    detailTr.appendChild(detailTd);

    return [tr, detailTr];
  }

  async function toggleDetail(tr, btn, row) {
    const detailTr = tr.nextElementSibling;
    const expanded = btn.getAttribute('aria-expanded') === 'true';

    if (expanded) {
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = '+';
      detailTr.hidden = true;
      return;
    }

    btn.setAttribute('aria-expanded', 'true');
    btn.textContent = '–';
    detailTr.hidden = false;

    const container = detailTr.querySelector('.lineup-group');
    container.innerHTML = `<div class="week-title muted">Loading…</div>`;

    const data = await fetchPlayedLineups(row.team_id);
    if (!data.length) {
      container.innerHTML = `<div class="muted">No played lineups yet.</div>`;
      return;
    }

    // Group by week if present, otherwise by game_date
    const groups = groupBy(data, r => r.week ?? r.game_date ?? 'Unknown');

    container.innerHTML = '';
    for (const [key, rows] of groups) {
      const block = document.createElement('div');
      block.className = 'lineup-group';

      const title = document.createElement('div');
      title.className = 'week-title';
      title.textContent = isNaN(Number(key)) ? `Date: ${key}` : `Week ${key}`;
      block.appendChild(title);

      rows.forEach(p => {
        const div = document.createElement('div');
        div.className = 'player';

        const left = document.createElement('div');
        left.textContent = `${p.player_name}${p.position ? ' · ' + p.position : ''}${p.opponent ? ' · ' + p.opponent : ''}`;

        const right = document.createElement('div');
        const played = document.createElement('span');
        played.className = 'badge played';
        played.textContent = 'Played';
        const pts = document.createElement('span');
        pts.className = 'badge points';
        pts.textContent = `${Number(p.points || 0).toFixed(2)} pts`;
        right.append(played, pts);

        div.append(left, right);
        block.appendChild(div);
      });

      container.appendChild(block);
    }
  }

  function groupBy(arr, keyFn) {
    const m = new Map();
    for (const x of arr) {
      const k = keyFn(x);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(x);
    }
    return m;
  }

  (async function init() {
    const tbody = document.getElementById('od-leaderboard-body');
    tbody.innerHTML = `<tr><td colspan="3" class="muted">Loading leaderboard…</td></tr>`;

    const teams = await fetchLeaderboardTeams();
    tbody.innerHTML = '';
    teams.forEach(team => {
      const [tr, detailTr] = renderLeaderboardRow(team);
      tbody.appendChild(tr);
      tbody.appendChild(detailTr);
    });
  })();
</script>