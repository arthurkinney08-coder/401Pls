
// src/lib/sendPickConfirmation.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

type PickPayload = { poolId: string; pickId: string }

type SendPickConfirmationResult = {
  ok: boolean
  user_id: string
  poolId: string
  pickId: string
}

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[sendPickConfirmation] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
;(window as any).supabase = supabaseClient
export async function sendPickConfirmation(
  supabase: SupabaseClient,
  payload: PickPayload
): Promise<SendPickConfirmationResult> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated: missing session/access_token')
  }

  const FUNCTION_URL = `${(supabase as any).supabaseUrl}/functions/v1/send-pick-confirmation`

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`send-pick-confirmation failed: ${res.status} ${text}`)
  }

  try {
    return JSON.parse(text) as SendPickConfirmationResult
  } catch {
    return { ok: true, user_id: '', poolId: payload.poolId, pickId: payload.pickId }
  }
}

export async function sendPickConfirmationDefault(payload: PickPayload) {
  return sendPickConfirmation(supabaseClient, payload)
}
