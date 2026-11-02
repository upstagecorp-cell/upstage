import { requireUser } from '@/lib/server/auth'
import { workspace } from '@/lib/server/database'
import { json, route } from '@/lib/server/http'

export const runtime = 'nodejs'

export function GET(request: Request): Promise<Response> {
  return route(async () => {
    const user = requireUser(request)
    return json({ workspace: workspace(user.id) })
  })
}

