import { requireUser, limit } from '@/lib/server/auth'
import { recordFeedback } from '@/lib/server/investigations'
import { json, readJson, route } from '@/lib/server/http'

export const runtime = 'nodejs'
export function POST(request: Request): Promise<Response> {
  return route(async () => {
    const user = requireUser(request)
    const input = await readJson(request)
    limit(`feedback:${user.id}`, 30, 15 * 60_000)
    return json({ feedback: recordFeedback(user.id, input) })
  })
}
