import { requireUser, limit } from '@/lib/server/auth'
import { saveImageProject } from '@/lib/server/image-studio'
import { json, readJson, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function PUT(request: Request, context: { params: Promise<{ id: string }> }) { return route(async () => {
  const user = requireUser(request), { id } = await context.params, input = await readJson(request)
  limit(`image-project-edit:${user.id}`, 60, 60 * 60_000)
  return json({ project: saveImageProject(user.id, input, id) })
}) }
