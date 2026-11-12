import { requireUser } from '@/lib/server/auth'
import { approveImageVersion } from '@/lib/server/image-studio'
import { json, readJson, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function POST(request: Request, context: { params: Promise<{ id: string }> }) { return route(async () => {
  const user = requireUser(request), { id } = await context.params, input = await readJson(request)
  return json({ project: approveImageVersion(user.id, id, input) })
}) }
