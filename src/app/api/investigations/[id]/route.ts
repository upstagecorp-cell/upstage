import { requireUser, limit } from '@/lib/server/auth'
import { saveInvestigation } from '@/lib/server/investigations'
import { json, readJson, route } from '@/lib/server/http'

export const runtime = 'nodejs'
export function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  return route(async () => {
    const user = requireUser(request)
    const input = await readJson(request)
    limit(`mutation:${user.id}`, 120, 15 * 60_000)
    const { id } = await context.params
    return json({ workspace: saveInvestigation(user.id, input, id) })
  })
}
