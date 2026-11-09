import { requireUser, limit } from '@/lib/server/auth'
import {
  focusedFeedback,
  productEvents,
  recordProductEvent,
} from '@/lib/server/investigations'
import { json, readJson, route } from '@/lib/server/http'

export const runtime = 'nodejs'
export function GET(request: Request): Promise<Response> {
  return route(async () => {
    const user = requireUser(request)
    return json({
      events: productEvents(user.id),
      feedback: focusedFeedback(user.id),
    })
  })
}
export function POST(request: Request): Promise<Response> {
  return route(async () => {
    const user = requireUser(request)
    const input = await readJson(request)
    limit(`events:${user.id}`, 120, 15 * 60_000)
    return json({ event: recordProductEvent(user.id, input) })
  })
}
