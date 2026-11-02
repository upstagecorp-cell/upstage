import { authenticate, sessionCookie } from '@/lib/server/auth'
import { json, readJson, route } from '@/lib/server/http'

export const runtime = 'nodejs'

export function POST(request: Request): Promise<Response> {
  return route(async () => {
    const user = await authenticate(await readJson(request), true)
    return json({ user }, 200, { 'Set-Cookie': sessionCookie(request, user.id) })
  })
}

