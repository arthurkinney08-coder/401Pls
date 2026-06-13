// supabase/functions/sync-sleeper/index.ts
// Syncs NFL players from Sleeper API and detects current round.
// Runs on a cron schedule — no input needed.
// Env: SUPABASE_URL (auto), SERVICE_ROLE_KEY (secret)
 
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE  = Deno.env.get('SERVICE_ROLE_KEY')!;
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
 
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });
 
// ---- Positions we care about ----
const VALID_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF']);
 
// ---- Map Sleeper position to our schema ----
function mapPosition(pos: string): string | null {
  if (!pos) return null;
  const p = pos.toUpperCase();
  if (p === 'DEF') return 'DST';
  if (VALID_POSITIONS.has(p)) return p;
  return null;
}
 
// ---- Map NFL week/season_type to round label ----
function mapWeekToRound(week: number, seasonType: string): string {
  if (seasonType === 'post') {
    switch (week) {
      case 1: return 'Wild Card Round';
      case 2: return 'Divisional Round';
      case 3: return 'Conference Championship';
      case 4: return 'Super Bowl';
      default: return `Playoff Week ${week}`;
    }
  }
  if (seasonType === 'regular') return `Week ${week}`;
  return 'Offseason';
}
 
// ---- Fetch current NFL state from Sleeper ----
async function fetchNFLState() {
  const res = await fetch('https://api.sleeper.app/v1/state/nfl');
  if (!res.ok) throw new Error(`Sleeper state fetch failed: ${res.status}`);
  return await res.json();
}
 
// ---- Fetch all NFL players from Sleeper ----
async function fetchSleeperPlayers() {
  const res = await fetch('https://api.sleeper.app/v1/players/nfl');
  if (!res.ok) throw new Error(`Sleeper players fetch failed: ${res.status}`);
  return await res.json();
}
 
// ---- Store current round in pool_settings or a dedicated table ----
async function storeCurrentRound(roundLabel: string, week: number, seasonType: string) {
  const entries = [
    { key: 'current_round_label', value: roundLabel },
    { key: 'current_week', value: String(week) },
    { key: 'current_season_type', value: seasonType },
  ];

  for (const entry of entries) {
    await sb
      .from('system_settings')
      .upsert({ ...entry, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  }
}
 
// ---- Upsert players in batches ----
async function upsertPlayers(players: any[]) {
  let inserted = 0, skipped = 0;

  // Build clean rows first, de-duplicating on external_player_id
  const seen = new Set<string>();
  const rows: any[] = [];

  for (const p of players) {
    const full_name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
    const position = mapPosition(p.position || p.fantasy_positions?.[0] || '');
    if (!full_name || !position || !p.player_id) { skipped++; continue; }

    // skip duplicate player_ids within this batch (Sleeper sometimes repeats)
    if (seen.has(p.player_id)) { skipped++; continue; }
    seen.add(p.player_id);

    rows.push({
      full_name,
      position,
      team: p.team || null,
      external_provider: 'sleeper',
      external_player_id: p.player_id,
      external_id: p.player_id,
      is_active: p.active === true,
      injury_status: p.injury_status || null,
      sport: 'nfl',
    });
  }

  // Upsert in batches of 500 (one DB round-trip each)
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const result = await sb
      .from('players')
      .upsert(batch, { onConflict: 'external_provider,external_player_id' });

    if (result.error) {
      console.warn(`Batch ${i}-${i + BATCH} failed:`, result.error.message);
      skipped += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, skipped };
}
// ---- Main ----
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
 
  try {
    console.log('sync-sleeper: starting...');
 
    // 1. Get current NFL state
    const state = await fetchNFLState();
    const week       = state.week || 1;
    const seasonType = state.season_type || 'off'; // 'pre' | 'regular' | 'post' | 'off'
    const season     = state.season || new Date().getFullYear();
    const roundLabel = mapWeekToRound(week, seasonType);
 
    console.log(`NFL state: season=${season} type=${seasonType} week=${week} → "${roundLabel}"`);
 
    // 2. Store current round so lineup saves can stamp it
    await storeCurrentRound(roundLabel, week, seasonType);
 
    // 3. Fetch all players
    console.log('Fetching Sleeper players...');
    const sleeperPlayers = await fetchSleeperPlayers();
    const allPlayers = Object.values(sleeperPlayers);
    console.log(`Fetched ${allPlayers.length} players from Sleeper`);
 
    // 4. Filter to active skill positions only
   const filtered = allPlayers.filter((p: any) =>
  p.sport === 'nfl' &&
  mapPosition(p.position || p.fantasy_positions?.[0] || '') !== null &&
  (p.first_name || p.last_name)
);
    console.log(`Filtered to ${filtered.length} active skill position players`);
 
    // 5. Upsert into DB
    const { inserted, skipped } = await upsertPlayers(filtered);
 
    return json({
      ok: true,
      season,
      season_type: seasonType,
      week,
      current_round: roundLabel,
      players_fetched: allPlayers.length,
      players_filtered: filtered.length,
      players_upserted: inserted,
      players_skipped: skipped,
    });
 
  } catch (e) {
    console.error('sync-sleeper error:', e);
    return json({ ok: false, error: String(e) }, 500);
  }
});