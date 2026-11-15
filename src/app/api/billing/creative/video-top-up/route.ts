import { requireUser, limit } from '@/lib/server/auth'
import { createLongVideoTopUp } from '@/lib/server/creative-billing'
import { json, readJson, route } from '@/lib/server/http'

export const runtime = 'nodejs'

export function POST(request: Request) {
  return route(async () => {
    const user = requireUser(request)
    const input = await readJson(request)
    limit(`creative-video-topup:${user.id}`, 5, 60_000)
    return json({ url: await createLongVideoTopUp(user, input) })
  })
}
