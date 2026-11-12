import { requireUser, limit } from '@/lib/server/auth'
import { saveImageProject } from '@/lib/server/image-studio'
import { json, readJson, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function POST(request: Request) { return route(async () => {
  const user = requireUser(request), input = await readJson(request)
  limit(`image-project:${user.id}`, 60, 60 * 60_000)
  return json({ project: saveImageProject(user.id, input) }, 201)
}) }
