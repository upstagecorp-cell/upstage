import { InputError } from '@/lib/business/validation'
import { mutationGuard } from './auth'
import { HttpError } from './errors'

export async function readJson(request: Request): Promise<unknown> {
  mutationGuard(request)
  const limit = 512 * 1024
  const length = Number(request.headers.get('content-length'))
  if (length > limit) throw new HttpError(413, 'REQUEST_TOO_LARGE', 'This request is too large.')
  const reader = request.body?.getReader()
  if (!reader) throw new HttpError(400, 'INVALID_JSON', 'Enter a valid JSON request.')
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > limit) {
      await reader.cancel()
      throw new HttpError(413, 'REQUEST_TOO_LARGE', 'This request is too large.')
    }
    chunks.push(value)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  catch { throw new HttpError(400, 'INVALID_JSON', 'Enter a valid JSON request.') }
}

export function json(value: unknown, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers)
  responseHeaders.set('Cache-Control', 'no-store')
  responseHeaders.set('X-Content-Type-Options', 'nosniff')
  return Response.json(value, { status, headers: responseHeaders })
}

export async function route(operation: () => Response | Promise<Response>): Promise<Response> {
  try { return await operation() }
  catch (error) {
    if (error instanceof HttpError || error instanceof InputError) {
      return json({ error: error.message, code: error.code }, error.status)
    }
    // Do not leak provider payloads, SQL, paths, credentials, or business inputs.
    return json({ error: 'The request could not be completed. Please try again.', code: 'INTERNAL_ERROR' }, 500)
  }
}
