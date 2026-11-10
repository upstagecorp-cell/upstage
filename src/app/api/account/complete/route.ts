import { completeAccountToken } from '@/lib/server/account-email'
import { limit } from '@/lib/server/auth'
import { json, readJson, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function POST(request: Request) { return route(async () => {
  const input = await readJson(request)
  limit('account-token:global', 60, 60_000)
  return json({ completed: await completeAccountToken(input) })
}) }
