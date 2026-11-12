import { requireUser } from '@/lib/server/auth'
import { readMediaFile } from '@/lib/server/media-files'
import { route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function GET(request: Request, context: { params: Promise<{ id: string }> }) { return route(async () => {
  const user = requireUser(request), { id } = await context.params, { file, bytes } = await readMediaFile(user.id, id)
  return new Response(bytes, { headers: {
    'Content-Type': file.type, 'Content-Length': String(bytes.length), 'Cache-Control': 'private, no-store',
    'Content-Disposition': `${new URL(request.url).searchParams.get('download') === '1' ? 'attachment' : 'inline'}; filename="${file.objectName}"`,
    'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox",
  } })
}) }
