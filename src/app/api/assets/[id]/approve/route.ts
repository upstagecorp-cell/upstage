import { limit, requireUser } from '@/lib/server/auth'
import { json, readJson, route } from '@/lib/server/http'
import { approveAsset } from '@/lib/server/operations'

export const runtime = 'nodejs'

export function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return route(async () => {
    const user = requireUser(request)
    const input = await readJson(request)
    limit(`mutation:${user.id}`, 120, 15 * 60_000)
    return json({ workspace: approveAsset(user.id, (await context.params).id, input) })
  })
}
