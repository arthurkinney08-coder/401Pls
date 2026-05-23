// supabase/functions/send-pick-confirmation/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-auth, x-client-info, apikey, content-type',
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
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: CORS_HEADERS,
      })
    }

    // 1) Token from Authorization: Bearer … or X-Client-Auth
    const authHeader = req.headers.get('Authorization') ?? ''
    const xClientAuth = req.headers.get('X-Client-Auth') ?? ''
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    const token = bearer || xClientAuth

    if (!token) {
      return new Response(JSON.stringify({ code: 401, message: 'Invalid JWT' }), {
        status: 401,
        headers: CORS_HEADERS,
      })
    }

    // 2) Create server client with SERVICE ROLE (for SQL) + forward user JWT (for RLS context if needed)
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error('[fn] Missing SUPABASE_URL or SERVICE ROLE KEY')
      return new Response(JSON.stringify({ code: 500, message: 'Server misconfigured' }), {
        status: 500,
        headers: CORS_HEADERS,
      })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
auth: { persistSession: false }
    })

    // 3) Validate current user
  // Use the explicit token (most reliable on Edge)
// 3) Validate current user (explicit token is most reliable on Edge)
const { data: authData, error: userError } = await supabase.auth.getUser(token)
const user = authData?.user
if (userError || !user) {
  console.log('[fn] getUser failed:', userError?.message ?? 'no user')
  return new Response(JSON.stringify({ code: 401, message: 'Invalid JWT' }), {
    status: 401, headers: CORS_HEADERS,
  })
}
  const user = authData?.user
    if (userError || !user) {
      console.log('[fn] getUser failed:', userError?.message ?? 'no user')
      return new Response(JSON.stringify({ code: 401, message: 'Invalid JWT' }), {
        status: 401,
        headers: CORS_HEADERS,
      })
    }

    // 4) Parse payload
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const {
      entry_id,
      window_id,
      poolId,
      pickId,
    }: {
      entry_id?: string
      window_id?: string | null
      poolId?: string
      pickId?: string
    } = body

    if (!entry_id && !pickId) {
      return new Response(
        JSON.stringify({ error: 'Missing required identifier (entry_id or pickId)' }),
        { status: 400, headers: CORS_HEADERS },
      )
    }

    // 5) Load picks for this entry (+ optional window filter)
    //    Expect a FK from one_and_done_picks.player_id -> players.id
    //    If your relation alias differs, tell me & I’ll adjust select().
    let q = supabase
      .from('one_and_done_picks')
      .select('slot, player_id, window_id, players(full_name,team)')
      .eq('entry_id', entry_id!)

    if (window_id === null) q = q.is('window_id', null)
    else if (typeof window_id === 'string') q = q.eq('window_id', window_id)

    const { data: rows, error: picksErr } = await q
    if (picksErr) {
      console.error('[fn] picks query failed:', picksErr.message)
      return new Response(JSON.stringify({ error: 'Failed to fetch picks' }), {
        status: 500,
        headers: CORS_HEADERS,
      })
    }

    const slotOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST']
    const lines = (rows as RowPick[]).sort(
      (a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot),
    )

    // 6) Build email
    const to = user.email
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Pools <no-reply@example.com>'
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') // set this in secrets
    if (!RESEND_API_KEY) {
      console.error('[fn] Missing RESEND_API_KEY')
      return new Response(JSON.stringify({ error: 'Email provider is not configured' }), {
        status: 500,
        headers: CORS_HEADERS,
      })
    }

    const subject = `Your One & Done picks${window_id ? ` — window ${window_id}` : ''}`
    const htmlRows = lines.length
      ? lines
          .map((r) => {
            const p = r.players || {}
            const name = p.full_name ?? r.player_id
            const team = p.team ? ` (${p.team})` : ''
            const win = r.window_id ? ` • Window ${r.window_id}` : ''
            return `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${r.slot}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;"><strong>${name}</strong>${team}${win}</td></tr>`
          })
          .join('')
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

    // 7) Send via Resend (Edge-friendly HTTP)
    const mailResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    })

    if (!mailResp.ok) {
      const msg = await mailResp.text().catch(() => '')
      console.error('[fn] Resend failed:', mailResp.status, msg)
      return new Response(JSON.stringify({ error: 'Email send failed' }), {
        status: 502,
        headers: CORS_HEADERS,
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: CORS_HEADERS,
    })
  } catch (e) {
    console.error('[fn/send-pick-confirmation] error:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
})