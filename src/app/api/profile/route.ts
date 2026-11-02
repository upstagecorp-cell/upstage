import { requireUser, limit } from '@/lib/server/auth'
import { updateProfile } from '@/lib/server/operations'
import { json, readJson, route } from '@/lib/server/http'

export const runtime = 'nodejs'

export function PUT(request: Request): Promise<Response> {
  return route(async () => {
    const user = requireUser(request)
    const input = await readJson(request)
    limit(`mutation:${user.id}`, 120, 15 * 60_000)
    return json({ workspace: updateProfile(user.id, input) })
  })
}

