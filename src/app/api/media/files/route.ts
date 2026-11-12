import { requireUser, limit } from '@/lib/server/auth'
import { listMediaFiles, uploadImage } from '@/lib/server/media-files'
import { readImageUpload, withUploadSlot } from '@/lib/server/media-http'
import { json, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function GET(request: Request) { return route(async () => json({ files: listMediaFiles(requireUser(request).id) })) }
export function POST(request: Request) { return route(async () => {
  const user = requireUser(request)
  limit(`media-upload:${user.id}`, 30, 60 * 60_000)
  limit('media-upload:global', 300, 60 * 60_000)
  return withUploadSlot(async () => {
    const file = await readImageUpload(request)
    return json({ file: await uploadImage(user.id, file.bytes, file.name, file.role) }, 201)
  })
}) }
