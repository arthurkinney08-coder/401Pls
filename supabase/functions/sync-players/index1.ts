
// supabase/functions/sync-players/index.ts
// Minimal stub to upsert players from a provider OR run in demo mode.
// Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in function env

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";



// --- CORS helper ---
const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};

function cors(body: BodyInit, init: ResponseInit = {}) {
  return new Response(body, {
    ...init,
    headers: { ...(init.headers || {}), ...corsHeaders, 'content-type': 'application/json' },
  });
}


type Payload = {
  mode?: 'demo' | 'provider';
  provider?: 'api-sports' | 'goalserve' | string;
  players?: Array<{
    external_id?: string;
    full_name: string;
    position: 'QB'|'RB'|'WR'|'TE'|'K'|'DST';
    team?: string | null;
    kickoff_utc?: string | null; // ISO
  }>;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function mapKickoffToWindow(kickoffISO?: string | null) {
  if (!kickoffISO) return null;
  // Pick the nearest window starting at the same hour (simple mapping for now)
  const { data: wins } = await sb.from('round_time_windows').select('id,start_at_utc').order('start_at_utc');
  if (!wins || wins.length === 0) return null;
  const target = new Date(kickoffISO).getTime();
  let best: any = null; let bestDiff = Number.POSITIVE_INFINITY;
  for (const w of wins) {
    const diff = Math.abs(new Date(w.start_at_utc as string).getTime() - target);
    if (diff < bestDiff) { bestDiff = diff; best = w; }
  }
  return best?.id ?? null;
}

async function upsertPlayers(provider: string, rows: NonNullable<Payload['players']>) {
  const results: any[] = [];
  for (const p of rows) {
    const time_window_id = await mapKickoffToWindow(p.kickoff_utc ?? null);
    const payload: any = {
      full_name: p.full_name,
      position: p.position,
      team: p.team ?? null,
      time_window_id,
      external_provider: provider,
      external_player_id: p.external_id ?? null,
      is_active: true,
    };
    // Upsert by provider+external_id when available; otherwise by (full_name, position, team) as a fallback
    const onConflict = p.external_id ? 'external_provider,external_player_id' : undefined;
    const q = sb.from('players').upsert(payload, { onConflict, ignoreDuplicates: false }).select('id');
    const { data, error } = await q;
    if (error) results.push({ full_name: p.full_name, error: error.message });
    else results.push({ full_name: p.full_name, id: data?.[0]?.id || null, time_window_id });
  }
  return results;
}



serve(async (req) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
const body = (await req.json().catch(() => ({}))) as Payload;
const mode = body.mode ?? 'demo';

// ✅ ALWAYS initialize provider & players
let provider = body.provider ?? 'demo';
let players  = body.players  ?? [];

// Demo mode: create two sample players if none provided
if (mode === 'demo' && players.length === 0) {
  const now = new Date();
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
  const in5h = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString();
  players = [
    { external_id: 'demo-1', full_name: 'Demo QB One', position: 'QB', team: 'DEM', kickoff_utc: in2h },
    { external_id: 'demo-2', full_name: 'Demo RB One', position: 'RB', team: 'DEM', kickoff_utc: in5h },
  ];
  provider = 'demo';
}

// … leave the rest of your logic intact …
const results = await upsertPlayers(provider, players);
return cors(JSON.stringify({ ok: true, count: results.length, results }), { status: 200 });

