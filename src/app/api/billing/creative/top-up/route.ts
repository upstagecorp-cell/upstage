import { requireUser, limit } from '@/lib/server/auth'
import { createMotionTopUp } from '@/lib/server/creative-billing'
import { json, readJson, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function POST(request: Request) { return route(async () => {
  const user = requireUser(request), input = await readJson(request)
  limit(`creative-topup:${user.id}`, 10, 60_000)
  return json({ url: await createMotionTopUp(user, input) })
}) }
