import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

function readRequired(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim()
    && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  )
}

/**
 * Server-only Supabase client. The secret key bypasses RLS, so every caller must
 * authenticate and authorize the NEXORA owner before using this client.
 */
export function supabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient
  const url = readRequired('SUPABASE_URL')
  const secretKey = readRequired('SUPABASE_SERVICE_ROLE_KEY')
  adminClient = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
  return adminClient
}

/** Used by the health route without exposing any key or provider response. */
export async function checkSupabaseConnection(): Promise<void> {
  const url = readRequired('SUPABASE_URL')
  const secretKey = readRequired('SUPABASE_SERVICE_ROLE_KEY')
  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, {
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) {
    await response.body?.cancel()
    throw new Error(`Supabase REST gateway returned ${response.status}`)
  }
}

export function resetSupabaseClientForTests(): void {
  adminClient = null
}
