import { logout } from '@/lib/server/auth'
import { json, readJson, route } from '@/lib/server/http'

export const runtime = 'nodejs'

export function POST(request: Request): Promise<Response> {
  return route(async () => {
    await readJson(request)
    return json({}, 200, { 'Set-Cookie': logout(request) })
  })
}
