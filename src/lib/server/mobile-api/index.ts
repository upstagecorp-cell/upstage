import { Pool } from 'pg'
import { createMobileAuth, MobileAuthError } from '../mobile-auth'

// INTERNAL FUNCTION TESTS ONLY. Never import this module from an HTTP route.
// The web's SQLite account store is authoritative; this is not a production API.
const MAX_BODY_BYTES = 8 * 1024

type ErrorCode = 'INVALID_INPUT' | 'INVALID_CREDENTIALS' | 'INVALID_TOKEN' | 'NOT_FOUND' |
  'PAYLOAD_TOO_LARGE' | 'UNSUPPORTED_MEDIA_TYPE' | 'SERVER_ERROR'
const ERRORS: Record<ErrorCode, { status: number; message: string }> = {
  INVALID_INPUT: { status: 400, message: 'Invalid input.' },
  INVALID_CREDENTIALS: { status: 401, message: 'The email or password is incorrect.' },
  INVALID_TOKEN: { status: 401, message: 'Authentication required.' },
  NOT_FOUND: { status: 404, message: 'Session not found.' },
  PAYLOAD_TOO_LARGE: { status: 413, message: 'Request body is too large.' },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, message: 'Expected an uncompressed JSON request.' },
  SERVER_ERROR: { status: 503, message: 'Authentication is temporarily unavailable.' },
}
class ApiError extends Error {
  constructor(readonly code: ErrorCode) { super() }
}


function response(data: unknown, status = 200, extra?: HeadersInit): Response {
  const headers = new Headers(extra)
  headers.set('Cache-Control', 'no-store')
  headers.set('Pragma', 'no-cache')
  headers.set('X-Content-Type-Options', 'nosniff')
  return Response.json(data, { status, headers })
}

function errorResponse(error: unknown): Response {
  // Never reflect exception text, database errors, input, or tokens into a response or log.
  let code: ErrorCode = 'SERVER_ERROR'
  if (error instanceof ApiError) code = error.code
  else if (error instanceof MobileAuthError && Object.hasOwn(ERRORS, error.code)) code = error.code
  const { status, message } = ERRORS[code]
  const headers: Record<string, string> = {}
  if (status === 401) headers['WWW-Authenticate'] = 'Bearer'
  return response({ error: { code, message } }, status, headers)
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') || ''
  const contentEncoding = request.headers.get('content-encoding') || 'identity'
  if (!/^application\/json(?:\s*;\s*charset\s*=\s*(?:"utf-8"|utf-8))?\s*$/i.test(contentType) ||
      contentEncoding.toLowerCase() !== 'identity') throw new ApiError('UNSUPPORTED_MEDIA_TYPE')
  const contentLength = request.headers.get('content-length')
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength) || !Number.isSafeInteger(Number(contentLength))) throw new ApiError('INVALID_INPUT')
    if (Number(contentLength) > MAX_BODY_BYTES) throw new ApiError('PAYLOAD_TOO_LARGE')
  }
  if (!request.body) throw new ApiError('INVALID_INPUT')

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        // Do not wait for a hostile stream's cancel callback to finish.
        void reader.cancel().catch(() => {})
        throw new ApiError('PAYLOAD_TOO_LARGE')
      }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  let value: unknown
  try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) }
  catch { throw new ApiError('INVALID_INPUT') }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError('INVALID_INPUT')
  return value as Record<string, unknown>
}

function bearer(request: Request): string {
  const match = /^([A-Za-z]+) ([0-9a-f]{64})$/.exec(request.headers.get('authorization') || '')
  if (!match || match[1].toLowerCase() !== 'bearer') throw new ApiError('INVALID_TOKEN')
  return match[2]
}

// Only the explicitly configured disposable test DB is allowed. This cannot
// detect a tunnel: never forward this address to real data.
const TEST_DATABASE_URL = 'postgresql://postgres@127.0.0.1:55432/nexora_test'
function developmentPool(): Pool {
  if (process.env.NEXORA_MOBILE_DEV_DATABASE_URL !== TEST_DATABASE_URL) throw new ApiError('SERVER_ERROR')
  const pool = new Pool({
    host: '127.0.0.1', port: 55432, user: 'postgres', database: 'nexora_test',
    // A function prevents pg from silently falling back to PGPASSWORD for an empty password.
    password: async () => '',
    ssl: false, sslnegotiation: 'postgres', options: '-c statement_timeout=5000',
    application_name: 'nexora_mobile_dev', connectionTimeoutMillis: 2000,
    statement_timeout: 5000, lock_timeout: 5000, idle_in_transaction_session_timeout: 10000, max: 1,
  })
  // A disconnected idle client must not produce an unhandled error or leak details.
  pool.on('error', () => {})
  return pool
}

type Operation = 'login' | 'refresh' | 'logout' | 'logout-all'

export async function handleAuth(request: Request, operation: Operation): Promise<Response> {
  try {
    // Authentication is independent of cookies, URL query parameters and the web origin guard.
    const token = operation === 'logout' || operation === 'logout-all' ? bearer(request) : null
    const body = await readJson(request)
    const pool = developmentPool()
    try {
      const auth = createMobileAuth(pool)
      if (operation === 'login') return response({ data: await auth.signIn({ email: body.email, password: body.password }) })
      if (operation === 'refresh') return response({ data: await auth.refresh(body.refreshToken) })
      // The client's refreshToken field is accepted but never used for authorization.
      if (operation === 'logout') await auth.logout(token)
      else await auth.revokeAll(token)
      return response({ data: { revoked: true } })
    } finally { await pool.end() }
  } catch (error) { return errorResponse(error) }
}
