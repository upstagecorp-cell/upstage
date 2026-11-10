import { requireUser, limit } from '@/lib/server/auth'
import { createPortal } from '@/lib/server/billing'
import { json, readJson, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function POST(request: Request) { return route(async () => {
  const user = requireUser(request); await readJson(request)
  limit(`portal:${user.id}`, 10, 60_000)
  return json({ url: await createPortal(user.id) })
}) }
