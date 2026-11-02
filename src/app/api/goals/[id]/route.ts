import { requireUser } from '@/lib/server/auth'
import { json, readJson, route } from '@/lib/server/http'
import { savePlan } from '@/lib/server/plans'
export const runtime = 'nodejs'
export function PUT(request: Request, context: { params: Promise<{id: string}> }) {
  return route(async()=>{
    const user = requireUser(request)
    return json({ workspace: savePlan(user.id,await readJson(request),(await context.params).id) })
  })
}
