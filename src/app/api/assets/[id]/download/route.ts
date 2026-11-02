import { requireUser } from '@/lib/server/auth'
import { versionInput } from '@/lib/server/errors'
import { route } from '@/lib/server/http'
import { downloadAsset } from '@/lib/server/operations'

export const runtime = 'nodejs'

export function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return route(async () => {
    const user = requireUser(request)
    const version = versionInput(Number(new URL(request.url).searchParams.get('version')))
    const file = downloadAsset(user.id, (await context.params).id, version)
    return new Response(file.body, { headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    } })
  })
}
