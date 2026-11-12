import { requireUser, limit } from '@/lib/server/auth'
import { cancelCreativeRenewal } from '@/lib/server/creative-billing'
import { syncBilling } from '@/lib/server/billing'
import { workspace } from '@/lib/server/database'
import { json, readJson, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function POST(request: Request) { return route(async () => {
  const user = requireUser(request), input = await readJson(request)
  limit(`creative-cancel:${user.id}`, 10, 60_000)
  const result = await cancelCreativeRenewal(user.id, input)
  await syncBilling(user.id)
  return json({ ...result, workspace: workspace(user.id) })
}) }
