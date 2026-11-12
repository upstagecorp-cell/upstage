import { MAX_UPLOAD_BYTES } from './media-files'
import { mutationGuard } from './auth'
import { HttpError } from './errors'

let activeUploads = 0
export async function withUploadSlot<T>(operation: () => Promise<T>): Promise<T> {
  if (activeUploads >= 2) throw new HttpError(429, 'IMAGE_PROCESSING_BUSY', 'Image processing is busy. Please retry shortly; no design allowance was used.')
  activeUploads++
  try { return await operation() } finally { activeUploads-- }
}

export async function readImageUpload(request: Request) {
  // Reuse the same origin check without weakening the JSON mutation guard.
  const guard = new Request(request.url, { method: 'POST', headers: { origin: request.headers.get('origin') || '', 'sec-fetch-site': request.headers.get('sec-fetch-site') || '', 'content-type': 'application/json' } })
  mutationGuard(guard)
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.toLowerCase().startsWith('multipart/form-data;')) throw new HttpError(415, 'UPLOAD_FORM_REQUIRED', 'Use the photo upload form.')
  const ceiling = MAX_UPLOAD_BYTES + 64 * 1024
  if (Number(request.headers.get('content-length')) > ceiling) throw new HttpError(413, 'UPLOAD_TOO_LARGE', 'Upload a photo or logo up to 8 MB.')
  const reader = request.body?.getReader()
  if (!reader) throw new HttpError(400, 'INVALID_UPLOAD', 'Choose a photo or logo.')
  let size = 0; const chunks: Uint8Array[] = []
  while (true) {
    const part = await reader.read(); if (part.done) break
    size += part.value.length
    if (size > ceiling) { await reader.cancel(); throw new HttpError(413, 'UPLOAD_TOO_LARGE', 'Upload a photo or logo up to 8 MB.') }
    chunks.push(part.value)
  }
  let form: FormData
  try { form = await new Response(Buffer.concat(chunks), { headers: { 'content-type': contentType } }).formData() }
  catch { throw new HttpError(400, 'INVALID_UPLOAD', 'The upload form could not be read.') }
  const file = form.get('file'), role = form.get('role')
  if (!(file instanceof File) || form.getAll('file').length !== 1 || !['photo', 'logo'].includes(String(role))) throw new HttpError(400, 'INVALID_UPLOAD', 'Choose one photo or logo and its file type.')
  return { bytes: Buffer.from(await file.arrayBuffer()), name: file.name, role: role as 'photo' | 'logo' }
}
