import { createHash, randomUUID, scryptSync } from 'node:crypto'
import { Pool } from 'pg'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { handleAuth } from './index'

// Strict allowlist: this test must never accidentally write to a real DB. It
// expects an already-initialized isolated PostgreSQL 16 schema; no migration or TRUNCATE.
const ISOLATED_DATABASE = 'postgresql://postgres@127.0.0.1:55432/nexora_test'
const requestedDatabase = process.env.MOBILE_API_TEST_DATABASE_URL
if (requestedDatabase !== undefined && requestedDatabase !== ISOLATED_DATABASE) throw new Error('Only the explicitly isolated local test database is permitted.')
let pool: Pool
let seeded = false
const ownerA = randomUUID(), ownerB = randomUUID()
const emailA = `${ownerA}@mobile-api-test.invalid`, emailB = `${ownerB}@mobile-api-test.invalid`
const password = 'unique-test-password-123'
const salt = randomUUID().replaceAll('-', '')
const stored = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
type Pair = { user: { id: string; email: string; locale: string }; sessionId: string; tokenType: string;
  accessToken: string; refreshToken: string; accessExpiresAt: string; refreshExpiresAt: string; sessionExpiresAt: string }

function request(body: unknown, access?: string): Request {
  return new Request('https://internal.test/api/mobile/v1/auth', {
    method: 'POST', headers: { 'content-type': 'application/json', ...(access ? { authorization: `Bearer ${access}` } : {}) },
    body: JSON.stringify(body),
  })
}
async function parse(res: Response, expected: number, code?: string) {
  expect(res.status).toBe(expected)
  expect(res.headers.get('cache-control')).toBe('no-store')
  expect(res.headers.get('pragma')).toBe('no-cache')
  if (expected === 401) expect(res.headers.get('www-authenticate')).toBe('Bearer')
  const value = await res.json()
  if (code) expect(value).toMatchObject({ error: { code } })
  return value
}
async function signIn(email = emailA): Promise<Pair> {
  return (await parse(await handleAuth(request({ email, password }), 'login'), 200)).data
}

describe.skipIf(!requestedDatabase)('internal handleAuth function with isolated PostgreSQL 16', () => {
  beforeAll(async () => {
    pool = new Pool({ host: '127.0.0.1', port: 55432, user: 'postgres', database: 'nexora_test',
      password: async () => '', ssl: false, sslnegotiation: 'postgres',
      options: '-c statement_timeout=5000', connectionTimeoutMillis: 5000 })
    const server = await pool.query<{ version: number }>("SELECT current_setting('server_version_num')::int AS version")
    expect(server.rows[0].version).toBeGreaterThanOrEqual(160000)
    expect(server.rows[0].version).toBeLessThan(170000)
    await pool.query(`INSERT INTO public.users(id,email,password_hash,locale,created_at)
      VALUES ($1,$2,$3,'ko-KR',clock_timestamp()),($4,$5,$3,'en-US',clock_timestamp())`,
    [ownerA, emailA, stored, ownerB, emailB])
    seeded = true
  })
  afterAll(async () => {
    // Foreign-key cascades clean up only the rows belonging to these unique IDs.
    try {
      if (seeded) {
        await pool.query('DELETE FROM public.users WHERE id=ANY($1::text[])', [[ownerA, ownerB]])
        const remaining = await pool.query('SELECT count(*)::int AS n FROM public.mobile_auth_sessions WHERE owner_id=ANY($1::text[])', [[ownerA, ownerB]])
        expect(remaining.rows[0].n).toBe(0)
      }
    }
    finally { if (pool) await pool.end() }
  })
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('NEXORA_MOBILE_DEV_DATABASE_URL', ISOLATED_DATABASE)
  })
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

  it('returns correct envelopes and hashes real tokens, without revealing bad credentials', async () => {
    const pair = await signIn(emailA.toUpperCase())
    expect(pair.user).toEqual({ id: ownerA, email: emailA, locale: 'ko-KR' })
    expect(pair.tokenType).toBe('Bearer')
    expect(pair.accessToken).toMatch(/^[0-9a-f]{64}$/)
    expect(pair.refreshToken).toMatch(/^[0-9a-f]{64}$/)
    expect(Number.isFinite(Date.parse(pair.accessExpiresAt))).toBe(true)
    expect(Number.isFinite(Date.parse(pair.refreshExpiresAt))).toBe(true)
    expect(Number.isFinite(Date.parse(pair.sessionExpiresAt))).toBe(true)
    const saved = await pool.query(`SELECT a.token_hash AS access_hash,r.token_hash AS refresh_hash
      FROM public.mobile_auth_access_tokens a JOIN public.mobile_auth_refresh_tokens r ON r.session_id=a.session_id
      WHERE a.session_id=$1`, [pair.sessionId])
    expect(saved.rows).toEqual([{ access_hash: hash(pair.accessToken), refresh_hash: hash(pair.refreshToken) }])
    const wrong = await parse(await handleAuth(request({ email: emailA, password: 'wrong-password-123' }), 'login'), 401, 'INVALID_CREDENTIALS')
    const missing = await parse(await handleAuth(request({ email: `${randomUUID()}@mobile-api-test.invalid`, password }), 'login'), 401, 'INVALID_CREDENTIALS')
    expect(wrong).toEqual(missing)
    await parse(await handleAuth(request({ email: 'bad', password }), 'login'), 400, 'INVALID_INPUT')
  })

  it('rotates tokens, commits replay family revocation and leaves another family intact', async () => {
    const initial = await signIn()
    const other = await signIn()
    const next: Pair = (await parse(await handleAuth(request({ refreshToken: initial.refreshToken }), 'refresh'), 200)).data
    expect(next.sessionId).toBe(initial.sessionId)
    expect(next.accessToken).not.toBe(initial.accessToken)
    expect(next.refreshToken).not.toBe(initial.refreshToken)
    await parse(await handleAuth(request({ refreshToken: initial.refreshToken }, initial.accessToken), 'logout'), 401, 'INVALID_TOKEN')
    await parse(await handleAuth(request({ refreshToken: initial.refreshToken }), 'refresh'), 401, 'INVALID_TOKEN')
    await parse(await handleAuth(request({ refreshToken: next.refreshToken }, next.accessToken), 'logout'), 401, 'INVALID_TOKEN')
    await parse(await handleAuth(request({ refreshToken: next.refreshToken }), 'refresh'), 401, 'INVALID_TOKEN')
    const state = await pool.query(`SELECT revoked_at,(SELECT count(*)::int FROM public.mobile_auth_access_tokens WHERE session_id=$1) AS access_count
      FROM public.mobile_auth_sessions WHERE id=$1`, [initial.sessionId])
    expect(state.rows[0].revoked_at).toBeInstanceOf(Date)
    expect(state.rows[0].access_count).toBe(0)
    expect((await parse(await handleAuth(request({ refreshToken: 'ignored' }, other.accessToken), 'logout'), 200)).data).toEqual({ revoked: true })
  })

  it('revokes the winning family when the same refresh is sent concurrently', async () => {
    const initial = await signIn()
    const responses = await Promise.all([
      handleAuth(request({ refreshToken: initial.refreshToken }), 'refresh'),
      handleAuth(request({ refreshToken: initial.refreshToken }), 'refresh'),
    ])
    expect(responses.map(result => result.status).sort()).toEqual([200, 401])
    const winner = responses.find(result => result.status === 200)!
    const loser = responses.find(result => result.status === 401)!
    const next: Pair = (await parse(winner, 200)).data
    await parse(loser, 401, 'INVALID_TOKEN')
    await parse(await handleAuth(request({ refreshToken: next.refreshToken }), 'refresh'), 401, 'INVALID_TOKEN')
    await parse(await handleAuth(request({ refreshToken: next.refreshToken }, next.accessToken), 'logout'), 401, 'INVALID_TOKEN')
  })

  it('revokes the current family or all of the bearer owner, not another user', async () => {
    const a1 = await signIn(), a2 = await signIn(), b = await signIn(emailB)
    expect((await parse(await handleAuth(request({ refreshToken: b.refreshToken }, a1.accessToken), 'logout'), 200)).data).toEqual({ revoked: true })
    await parse(await handleAuth(request({ refreshToken: a1.refreshToken }), 'refresh'), 401, 'INVALID_TOKEN')
    const a3 = await signIn()
    expect((await parse(await handleAuth(request({ refreshToken: b.refreshToken }, a2.accessToken), 'logout-all'), 200)).data).toEqual({ revoked: true })
    await parse(await handleAuth(request({ refreshToken: a2.refreshToken }), 'refresh'), 401, 'INVALID_TOKEN')
    await parse(await handleAuth(request({ refreshToken: a3.refreshToken }), 'refresh'), 401, 'INVALID_TOKEN')
    const bNext: Pair = (await parse(await handleAuth(request({ refreshToken: b.refreshToken }), 'refresh'), 200)).data
    expect(bNext.user.id).toBe(ownerB)
  })

  it('rejects a non-allowlisted DB URL without leaking or logging it', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('NEXORA_MOBILE_DEV_DATABASE_URL', 'postgresql://private-user:private-password@127.0.0.1:1/nexora_test')
    const responses = [
      await handleAuth(request({ email: emailA, password }), 'login'),
      await handleAuth(request({ refreshToken: 'a'.repeat(64) }), 'refresh'),
      await handleAuth(request({ refreshToken: 'a'.repeat(64) }, 'b'.repeat(64)), 'logout'),
      await handleAuth(request({ refreshToken: 'a'.repeat(64) }, 'b'.repeat(64)), 'logout-all'),
    ]
    for (const response of responses) {
      const result = await parse(response, 503, 'SERVER_ERROR')
      expect(JSON.stringify(result)).not.toMatch(/private|127\.0\.0\.1|nexora_test/)
    }
    expect(log).not.toHaveBeenCalled(); expect(err).not.toHaveBeenCalled(); expect(warn).not.toHaveBeenCalled()
  })
})
