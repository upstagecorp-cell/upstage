import { requireUser, limit } from '@/lib/server/auth'
import { syncBilling } from '@/lib/server/billing'
import { workspace } from '@/lib/server/database'
import { json, readJson, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function POST(request: Request) { return route(async () => {
  const user = requireUser(request); await readJson(request)
  limit(`billing-refresh:${user.id}`, 10, 60_000)
  await syncBilling(user.id)
  return json({ workspace: workspace(user.id) })
}) }
