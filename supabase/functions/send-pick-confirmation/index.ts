import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '').trim()
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'No token provided' }), { 
        status: 401, headers: CORS_HEADERS 
      })
    }

    // Environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || '401 Fantasy Pools <onboarding@resend.dev>'

    // Admin client
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })

    // Verify user using admin client
    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token', detail: userError?.message }), { 
        status: 401, headers: CORS_HEADERS 
      })
    }

    // Parse body
    const body = await req.json().catch(() => ({}))
    const { entry_id, team_id } = body
    const lookupId = team_id || entry_id

    if (!lookupId) {
      return new Response(JSON.stringify({ error: 'Missing team_id or entry_id' }), { 
        status: 400, headers: CORS_HEADERS 
      })
    }

    // Get team name
    const { data: team } = await admin
      .from('teams')
      .select('name')
      .eq('id', lookupId)
      .maybeSingle()

    // Get picks for this team
    const { data: picks, error: picksErr } = await admin
      .from('one_and_done_picks')
      .select('slot, players(full_name, team)')
      .eq('team_id', lookupId)

    if (picksErr) {
      return new Response(JSON.stringify({ error: 'Failed to fetch picks' }), { 
        status: 500, headers: CORS_HEADERS 
      })
    }

    // Build email
    const order = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST']
    const sorted = (picks || []).sort((a: any, b: any) => 
      order.indexOf(a.slot) - order.indexOf(b.slot)
    )

    const rows = sorted.map((r: any) => {
      const name = r.players?.full_name ?? 'Unknown'
      const team = r.players?.team ? ` (${r.players.team})` : ''
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#3b82f6;">${r.slot}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${name}${team}</td>
      </tr>`
    }).join('')

    const html = `
      <div style="font:15px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111;max-width:520px;margin:0 auto">
        <div style="background:#0f1012;padding:24px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:1.4rem">401 Fantasy Pools 🏈</h1>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <h2 style="margin:0 0 8px 0">Lineup Saved!</h2>
          <p style="color:#6b7280;margin:0 0 20px 0">
            Your picks for <strong>${team?.name || 'your team'}</strong> have been saved successfully.
          </p>
          <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
            <thead>
              <tr style="background:#f9fafb">
                <th align="left" style="padding:8px 12px;border-bottom:2px solid #e5e7eb;font-size:13px;color:#6b7280;">SLOT</th>
                <th align="left" style="padding:8px 12px;border-bottom:2px solid #e5e7eb;font-size:13px;color:#6b7280;">PLAYER</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="2" style="padding:12px">No picks found</td></tr>'}</tbody>
          </table>
          <p style="margin:20px 0 0 0;color:#9ca3af;font-size:13px">
            Good luck! 🏆 — 401 Fantasy Pools
          </p>
        </div>
      </div>
    `

    // Send email via Resend
    const emailResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ['401pls@gmail.com'],
        subject: `✅ Your lineup is saved — ${team?.name || 'One & Done'}`,
        html
      })
    })

    if (!emailResp.ok) {
      const err = await emailResp.text()
      console.error('Resend error:', err)
      return new Response(JSON.stringify({ error: 'Email failed', detail: err }), { 
        status: 502, headers: CORS_HEADERS 
      })
    }

    return new Response(JSON.stringify({ ok: true }), { 
      status: 200, headers: CORS_HEADERS 
    })

  } catch (e) {
    console.error('Function error:', e)
    return new Response(JSON.stringify({ error: String(e) }), { 
      status: 500, headers: CORS_HEADERS 
    })
  }
})