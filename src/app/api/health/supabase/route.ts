import { checkSupabaseConnection, supabaseConfigured } from '@/lib/server/supabase'

export const runtime = 'nodejs'

export async function GET() {
  if (!supabaseConfigured()) {
    return Response.json({ status: 'not_configured', service: 'supabase' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  try {
    await checkSupabaseConnection()
    return Response.json({ status: 'ok', service: 'supabase' }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return Response.json({ status: 'unavailable', service: 'supabase' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
