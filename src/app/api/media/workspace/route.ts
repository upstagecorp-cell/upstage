import { requireUser } from '@/lib/server/auth'
import { studioWorkspace } from '@/lib/server/image-studio'
import { json, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function GET(request: Request) { return route(async () => json({ studio: studioWorkspace(requireUser(request).id) })) }
