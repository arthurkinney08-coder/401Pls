import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-auth, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

type RowPick = {
  slot: string
  player_id: string
  window_id: string | null
  players?: { full_name?: string | null; team?: string | null } | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS })
    }

    // 1) Token from Authorization: Bearer … or X-Client-Auth
    const authHeader = req.headers.get('Authorization') ?? ''
    const xClientAuth = req.headers.get('X-Client-Auth') ?? ''
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    const token = bearer || xClientAuth
    if (!token) {
      return new Response(JSON.stringify({ code: 401, message: 'Invalid JWT (diag-1)' }), { status: 401, headers: CORS_HEADERS })
    }

    // Decode payload (non-secret) to help diagnose project mismatch
    let jwtIss: string | null = null
    let jwtAud: string | null = null
    let jwtSub: string | null = null
    try {
      const raw = token.split('.')[1] || ''
      const payload = raw ? JSON.parse(atob(raw)) : null
      jwtIss = payload?.iss ?? null
      jwtAud = payload?.aud ?? null
      jwtSub = payload?.sub ?? null
    } catch (_) {}

    // 2) Env & clients
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')! // REQUIRED

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
      return new Response(
        JSON.stringify({
          code: 500,
          message: 'Server misconfigured: missing required env (diag-1)',
          diag: { SUPABASE_URL: !!SUPABASE_URL, SERVICE_ROLE: !!SERVICE_ROLE_KEY, ANON: !!ANON_KEY },
        }),
        { status: 500, headers: CORS_HEADERS }
      )
    }

    // ADMIN client (service role) — DB only
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

    // USER client (anon + forwarded JWT) — validate user
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    })

    // 3) Validate current user
    const { data: authData, error: userError } = await userClient.auth.getUser()
    const user = authData?.user
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          code: 401,
          message: 'Invalid JWT (diag-1)',
          diag: {
            iss: jwtIss,
            aud: jwtAud,
            sub: jwtSub,
            function_SUPABASE_URL: SUPABASE_URL,
            hint:
              'Compare iss host to SUPABASE_URL host. If different, the browser is using another project URL/anon. If same, verify the ANON key in secrets belongs to this project.',
          },
        }),
        { status: 401, headers: CORS_HEADERS }
      )
    }

    // 4) Parse body
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: CORS_HEADERS })
    }

    let { entry_id, window_id, poolId, pickId }:
      { entry_id?: string; window_id?: string | null; poolId?: string; pickId?: string } = body

    // 4a) Optional resolve: pickId -> entry_id
    if (!entry_id && pickId) {
      const { data: pr } = await admin
        .from('one_and_done_picks')
        .select('entry_id')
        .eq('id', pickId)
        .maybeSingle()
      entry_id = pr?.entry_id ?? entry_id
    }

    if (!entry_id) {
      return new Response(JSON.stringify({ error: 'Missing required identifier (entry_id or pickId)' }), {
        status: 400, headers: CORS_HEADERS,
      })
    }

    // 5) Load picks
    let q = admin
      .from('one_and_done_picks')
      .select('slot, player_id, window_id, players(full_name,team)')
      .eq('entry_id', entry_id)

    if (window_id === null) q = q.is('window_id', null)
    else if (typeof window_id === 'string') q = q.eq('window_id', window_id)

    const { data: rows, error: picksErr } = await q
    if (picksErr) {
      return new Response(JSON.stringify({ error: 'Failed to fetch picks' }), { status: 500, headers: CORS_HEADERS })
    }

    const order = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST']
    const lines = (rows as RowPick[]).sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot))

    // 6) Email
    const to = user.email
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Pools <no-reply@example.com>'
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Email provider is not configured' }), { status: 500, headers: CORS_HEADERS })
    }

    const subject = `Your One & Done picks${window_id ? ` — window ${window_id}` : ''}`
    const htmlRows = lines.length
      ? lines.map((r) => {
          const p = r.players || {}
          const name = p.full_name ?? r.player_id
          const team = p.team ? ` (${p.team})` : ''
          const win = r.window_id ? ` • Window ${r.window_id}` : ''
          return `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${r.slot}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;"><strong>${name}</strong>${team}${win}</td></tr>`
        }).join('')
      : `<tr><td colspan="2" style="padding:8px;">No picks found for this entry.</td></tr>`

    const html = `
      <div style="font:14px/1.45 -apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111">
        <h2 style="margin:0 0 8px 0;">Your One & Done picks</h2>
        <p style="margin:0 0 12px 0;">
          Entry: <code>${entry_id}</code>${window_id ? ` • Window <code>${window_id}</code>` : ''}
        </p>
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;min-width:420px">
          <thead>
            <tr><th align="left" style="padding:6px 8px;border-bottom:2px solid #333;">Slot</th>
                <th align="left" style="padding:6px 8px;border-bottom:2px solid #333;">Player</th></tr>
          </thead>
          <tbody>${htmlRows}</tbody>
        </table>
        <p style="margin:16px 0 6px 0;color:#666">If you didn’t request this email, you can ignore it.</p>
      </div>
    `

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    })
    if (!resp.ok) {
      const msg = await resp.text().catch(() => '')
      console.error('[fn] Resend failed:', resp.status, msg)
      return new Response(JSON.stringify({ error: 'Email send failed' }), { status: 502, headers: CORS_HEADERS })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS })
  } catch (e) {
    console.error('[fn/send-pick-confirmation] error:', e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS_HEADERS })
  }
})
``