import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MobileAuthError } from '../mobile-auth'
import { handleAuth } from './index'

const mock = vi.hoisted(() => ({
  pool: vi.fn(), end: vi.fn(), signIn: vi.fn(), refresh: vi.fn(), logout: vi.fn(), revokeAll: vi.fn(),
}))
vi.mock('pg', () => ({
  Pool: class {
    constructor(options: unknown) { mock.pool(options) }
    on() { return this }
    end = mock.end
  },
}))
vi.mock('../mobile-auth', async importOriginal => ({
  ...await importOriginal<typeof import('../mobile-auth')>(),
  createMobileAuth: () => ({ signIn: mock.signIn, refresh: mock.refresh, logout: mock.logout, revokeAll: mock.revokeAll }),
}))

const access = 'a'.repeat(64)
const refreshToken = 'b'.repeat(64)
const credentials = { email: 'person@example.com', password: 'not-a-real-password' }
const pair = { user: { id: 'test', email: credentials.email, locale: 'en-US' }, accessToken: access,
  refreshToken, accessExpiresAt: '2030-01-01T00:00:00.000Z' }

function request(body: unknown = credentials, authorization?: string): Request {
  return new Request('https://internal.example/api/mobile/v1/auth/login?token=ignored', {
    method: 'POST', headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) },
    body: JSON.stringify(body),
  })
}
async function status(response: Response, expected: number, code?: string) {
  expect(response.status).toBe(expected)
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(response.headers.get('pragma')).toBe('no-cache')
  if (expected === 401) expect(response.headers.get('www-authenticate')).toBe('Bearer')
  const json = await response.json()
  if (code) expect(json).toMatchObject({ error: { code } })
  return json
}

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('NEXORA_MOBILE_DEV_DATABASE_URL', 'postgresql://postgres@127.0.0.1:55432/nexora_test')
  mock.pool.mockReset()
  mock.end.mockReset().mockResolvedValue(undefined)
  mock.signIn.mockReset().mockResolvedValue(pair)
  mock.refresh.mockReset().mockResolvedValue(pair)
  mock.logout.mockReset().mockResolvedValue(undefined)
  mock.revokeAll.mockReset().mockResolvedValue(undefined)
})
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

describe('internal mobile API transport', () => {
  it('returns token pairs in a data envelope and passes only credential fields', async () => {
    const result = await status(await handleAuth(request({ ...credentials, ownerId: 'ignored' }), 'login'), 200)
    expect(result).toEqual({ data: pair })
    expect(mock.signIn).toHaveBeenCalledWith(credentials)
    expect(mock.end).toHaveBeenCalledOnce()
    const refreshed = await status(await handleAuth(request({ refreshToken, ignored: 'value' }), 'refresh'), 200)
    expect(refreshed).toEqual({ data: pair })
    expect(mock.refresh).toHaveBeenCalledWith(refreshToken)
  })

  it('authorizes logout solely by an exactly formatted bearer token, not the body or cookie', async () => {
    for (const operation of ['logout', 'logout-all'] as const) {
      for (const header of [undefined, '', 'Basic ' + access, 'Bearer', 'Bearer ' + access.toUpperCase(),
        'Bearer  ' + access, 'Bearer ' + access + ' trailing', 'Bearer ' + access + ', Bearer ' + access]) {
        await status(await handleAuth(request({ refreshToken }, header), operation), 401, 'INVALID_TOKEN')
      }
    }
    expect(mock.pool).not.toHaveBeenCalled()
    const body = { refreshToken: 'untrusted-and-ignored' }
    expect(await status(await handleAuth(request(body, 'bearer ' + access), 'logout'), 200)).toEqual({ data: { revoked: true } })
    expect(await status(await handleAuth(request(body, 'BEARER ' + access), 'logout-all'), 200)).toEqual({ data: { revoked: true } })
    expect(mock.logout).toHaveBeenCalledWith(access)
    expect(mock.revokeAll).toHaveBeenCalledWith(access)
  })

  it('returns fixed errors instead of leaking even a known exception message or status', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mock.signIn.mockRejectedValueOnce(new MobileAuthError('INVALID_CREDENTIALS', 599, 'SECRET-PASSWORD'))
    const known = await status(await handleAuth(request(), 'login'), 401, 'INVALID_CREDENTIALS')
    expect(JSON.stringify(known)).not.toContain('SECRET-PASSWORD')
    mock.signIn.mockRejectedValueOnce(new Error('SECRET-CONNECTION-URL and TOKEN'))
    const unknown = await status(await handleAuth(request(), 'login'), 503, 'SERVER_ERROR')
    expect(JSON.stringify(unknown)).not.toContain('SECRET')
    expect(mock.end).toHaveBeenCalledTimes(2)
    expect(log).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled(); expect(warn).not.toHaveBeenCalled()
  })

  it('sanitizes a database driver failure', async () => {
    mock.pool.mockImplementationOnce(() => { throw new Error('SECRET-CONNECTION-URL') })
    const result = await status(await handleAuth(request(), 'login'), 503, 'SERVER_ERROR')
    expect(JSON.stringify(result)).not.toContain('SECRET')
  })

  it('bounds actual streamed bytes even when Content-Length is absent or false', async () => {
    for (const length of [undefined, '1']) {
      const body = new ReadableStream<Uint8Array>({
        start(controller) { controller.enqueue(new Uint8Array(4096)); controller.enqueue(new Uint8Array(4097)); controller.close() },
      })
      const req = new Request('http://test/', { method: 'POST', headers: {
        'content-type': 'application/json', ...(length ? { 'content-length': length } : {}),
      }, body, duplex: 'half' } as RequestInit)
      await status(await handleAuth(req, 'login'), 413, 'PAYLOAD_TOO_LARGE')
    }
    await status(await handleAuth(new Request('http://test/', { method: 'POST', headers: {
      'content-type': 'application/json', 'content-length': '8193',
    }, body: '{}' }), 'login'), 413, 'PAYLOAD_TOO_LARGE')
    expect(mock.pool).not.toHaveBeenCalled()
  })

  it('accepts 8192 UTF-8 bytes and rejects 8193 bytes', async () => {
    const prefix = '{"padding":"', suffix = '"}'
    const payload = (size: number) => prefix + 'x'.repeat(size - prefix.length - suffix.length) + suffix
    await status(await handleAuth(new Request('http://test/', { method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' }, body: payload(8192) }), 'login'), 200)
    await status(await handleAuth(new Request('http://test/', { method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' }, body: payload(8193) }), 'login'), 413, 'PAYLOAD_TOO_LARGE')
    expect(mock.pool).toHaveBeenCalledTimes(1)
  })

  it('requires an uncompressed UTF-8 JSON object and rejects malformed lengths and bytes', async () => {
    const cases: [HeadersInit, BodyInit | null, number, string][] = [
      [{ 'content-type': 'text/plain' }, '{}', 415, 'UNSUPPORTED_MEDIA_TYPE'],
      [{ 'content-type': 'application/json', 'content-encoding': 'gzip' }, '{}', 415, 'UNSUPPORTED_MEDIA_TYPE'],
      [{ 'content-type': 'application/json; charset=latin1' }, '{}', 415, 'UNSUPPORTED_MEDIA_TYPE'],
      [{ 'content-type': 'application/json', 'content-length': '-1' }, '{}', 400, 'INVALID_INPUT'],
      [{ 'content-type': 'application/json' }, '[]', 400, 'INVALID_INPUT'],
      [{ 'content-type': 'application/json' }, 'null', 400, 'INVALID_INPUT'],
      [{ 'content-type': 'application/json' }, '{bad', 400, 'INVALID_INPUT'],
      [{ 'content-type': 'application/json' }, new Uint8Array([0xc3, 0x28]), 400, 'INVALID_INPUT'],
      [{ 'content-type': 'application/json' }, null, 400, 'INVALID_INPUT'],
    ]
    for (const [headers, body, expected, code] of cases) {
      await status(await handleAuth(new Request('http://test/', { method: 'POST', headers, body }), 'login'), expected, code)
    }
    expect(mock.pool).not.toHaveBeenCalled()
  })

  it('refuses remote, malformed, query-overridden or missing dev database URLs without connecting', async () => {
    for (const url of [undefined, '', 'not-url', 'postgresql://postgres@db.supabase.co:5432/nexora_test',
      'postgresql://postgres@localhost:55432/nexora_test', 'postgresql://postgres@127.0.0.1:55432/nexora_test?host=db.supabase.co',
      'postgresql://postgres@127.0.0.1:55432/', 'postgresql://postgres@127.0.0.1:55432/db%2Fname',
      'postgresql://postgres@127.0.0.1:5432/nexora_test', 'postgresql://other@127.0.0.1:55432/nexora_test',
      'postgresql://postgres:password@127.0.0.1:55432/nexora_test', 'postgres://postgres@127.0.0.1:55432/nexora_test',
      ' postgresql://postgres@127.0.0.1:55432/nexora_test',
      'https://postgres@127.0.0.1:55432/nexora_test']) {
      vi.stubEnv('NEXORA_MOBILE_DEV_DATABASE_URL', url)
      await status(await handleAuth(request(), 'login'), 503, 'SERVER_ERROR')
    }
    expect(mock.pool).not.toHaveBeenCalled()
  })
})
