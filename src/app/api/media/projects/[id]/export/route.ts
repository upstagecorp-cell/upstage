import { requireUser, limit } from '@/lib/server/auth'
import { enqueueImageExport } from '@/lib/server/image-studio'
import { json, readJson, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function POST(request: Request, context: { params: Promise<{ id: string }> }) { return route(async () => {
  const user = requireUser(request), { id } = await context.params, input = await readJson(request)
  limit(`image-export:${user.id}`, 60, 60 * 60_000)
  return json({ job: enqueueImageExport(user.id, id, input) }, 202)
}) }
