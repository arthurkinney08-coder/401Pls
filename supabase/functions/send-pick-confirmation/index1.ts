// supabase/functions/send-pick-confirmation/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// CORS: allow both auth headers + client-provided anon key
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-auth, x-project-apikey, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

Deno.serve(async (req) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: CORS_HEADERS,
      })
    }

    // 1) Token from Authorization or X-Client-Auth
    const authHeader = req.headers.get('Authorization') ?? ''
    const xClientAuth = req.headers.get('X-Client-Auth') ?? ''
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    const token = bearer || xClientAuth

    // Minimal, safe debug
    try {
      const head = token ? token.slice(0, 20) : 'NONE'
      let iss = 'NONE'
      if (token) {
        const payload = JSON.parse(atob((token.split('.')[1] ?? '')))
        iss = payload?.iss ?? 'NONE'
      }
      console.log('[fn/send-pick-confirmation] token head:', head, 'iss:', iss)
    } catch {
      console.log('[fn/send-pick-confirmation] token decode failed')
    }

    if (!token) {
      return new Response(JSON.stringify({ code: 401, message: 'Invalid JWT' }), {
        status: 401,
        headers: CORS_HEADERS,
      })
    }

    // 2) Verify token via Auth REST, using env anon key OR client-provided fallback
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const CLIENT_ANON_FALLBACK = req.headers.get('X-Project-Apikey') ?? ''
    const apiKeyForAuth = SUPABASE_ANON_KEY || CLIENT_ANON_FALLBACK

    if (!apiKeyForAuth) {
      console.log('[fn] No anon key available (env or X-Project-Apikey)')
      return new Response(JSON.stringify({ code: 401, message: 'Invalid JWT' }), {
        status: 401,
        headers: CORS_HEADERS,
      })
    }

    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': apiKeyForAuth,
      },
    })

    if (!userResp.ok) {
      const txt = await userResp.text().catch(() => '')
      console.log('[fn/send-pick-confirmation] auth/v1/user failed:', userResp.status, txt)
      return new Response(JSON.stringify({ code: 401, message: 'Invalid JWT' }), {
        status: 401,
        headers: CORS_HEADERS,
      })
    }

    const user = await userResp.json() as { id: string }

    // 3) Parse payload (support either shape)
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const {
      poolId,
      pickId,
      entry_id,
      team_id,
      window_id,
    }: {
      poolId?: string
      pickId?: string
      entry_id?: string
      team_id?: string
      window_id?: string | null
    } = body

    if (!poolId && !pickId && !entry_id && !team_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required identifiers (entry_id/team_id or poolId/pickId)' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // 4) Business logic goes here (send mail / log / etc.)
    // For now, return success so we can confirm auth end-to-end.
    return new Response(JSON.stringify({
      ok: true,
      user_id: user.id,
      poolId,
      pickId,
      entry_id,
      team_id,
      window_id,
    }), { status: 200, headers: CORS_HEADERS })
  } catch (e) {
    console.error('[fn/send-pick-confirmation] error:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
})