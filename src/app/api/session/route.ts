import { currentUser } from '@/lib/server/auth'
import { json, route } from '@/lib/server/http'

export const runtime = 'nodejs'

export function GET(request: Request): Promise<Response> {
  return route(async () => {
    return json({ user: currentUser(request) })
  })
}

