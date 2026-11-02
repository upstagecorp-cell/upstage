import { requireUser } from '@/lib/server/auth'
import { generate } from '@/lib/server/operations'
import { json, readJson, route } from '@/lib/server/http'

export const runtime = 'nodejs'

export function POST(request: Request): Promise<Response> {
  return route(async () => {
    const user = requireUser(request)
    const input = await readJson(request)
    return json({ workspace: await generate(user.id, input) })
  })
}

