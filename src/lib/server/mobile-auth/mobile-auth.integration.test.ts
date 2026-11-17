import { createHash, randomUUID, scryptSync } from 'node:crypto'
import { Pool } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createMobileAuth } from './index'

// Set ONLY to an isolated disposable test DB with the initial NEXORA migration
// and the Supabase roles already present. No global truncate or table drops.
const ISOLATED_DATABASE = 'postgresql://postgres@127.0.0.1:55432/nexora_test'
const databaseUrl = process.env.MOBILE_AUTH_TEST_DATABASE_URL
if (databaseUrl !== undefined && databaseUrl !== ISOLATED_DATABASE) throw new Error('Only the explicitly isolated local test database is permitted.')
const poolConfig = { host: '127.0.0.1', port: 55432, user: 'postgres', database: 'nexora_test',
  password: async () => '', ssl: false, sslnegotiation: 'postgres' as const,
  options: '-c statement_timeout=5000', connectionTimeoutMillis: 5000 }
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const password = 'integration-test-password-123'
const salt = 'abcdef1234567890abcdef1234567890'
const storedPassword = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`

describe.skipIf(!databaseUrl)('mobile authentication on PostgreSQL', () => {
  let pool: Pool
  let auth: ReturnType<typeof createMobileAuth>
  let seeded = false
  const ownerA = randomUUID()
  const ownerB = randomUUID()
  const emailA = `${ownerA}@mobile-test.example`
  const emailB = `${ownerB}@mobile-test.example`
  const loginA = () => auth.signIn({ email: emailA.toUpperCase(), password })
  const loginB = () => auth.signIn({ email: emailB, password })
  const identify = (token: string) => auth.withAuthorizedSession(token, async principal => principal)

  beforeAll(async () => {
    pool = new Pool({ ...poolConfig, max: 8 })
    auth = createMobileAuth(pool, { accessTtlSeconds: 60, refreshTtlSeconds: 600, sessionTtlSeconds: 1200 })
    const ready = await pool.query<{ ready: boolean }>(`SELECT
      current_setting('server_version_num')::int BETWEEN 160000 AND 169999
      AND to_regclass('public.users') IS NOT NULL
      AND to_regclass('public.mobile_auth_sessions') IS NOT NULL
      AND to_regclass('public.mobile_auth_access_tokens') IS NOT NULL
      AND to_regclass('public.mobile_auth_refresh_tokens') IS NOT NULL
      AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon')
      AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') AS ready`)
    if (!ready.rows[0].ready) throw new Error('Initialize the disposable PostgreSQL 16 test schema and roles before running this test.')
    await pool.query(`INSERT INTO public.users(id,email,password_hash,locale,created_at)
      VALUES ($1,$2,$3,'ko-KR',clock_timestamp()),($4,$5,$3,'en-US',clock_timestamp())`,
    [ownerA, emailA, storedPassword, ownerB, emailB])
    seeded = true
  })
  afterAll(async () => {
    try { if (seeded) await pool.query('DELETE FROM public.users WHERE id=ANY($1::text[])', [[ownerA, ownerB]]) }
    finally { if (pool) await pool.end() }
  })

  it('authenticates the legacy salt-string scrypt format and stores only token hashes', async () => {
    const pair = await loginA()
    expect(pair.user).toEqual({ id: ownerA, email: emailA, locale: 'ko-KR' })
    expect(pair.tokenType).toBe('Bearer')
    expect(pair.accessToken).toMatch(/^[0-9a-f]{64}$/)
    expect(pair.refreshToken).toMatch(/^[0-9a-f]{64}$/)
    expect(pair.accessToken).not.toBe(pair.refreshToken)
    expect(Date.parse(pair.refreshExpiresAt) - Date.parse(pair.accessExpiresAt)).toBe(540_000)
    expect(Date.parse(pair.sessionExpiresAt) - Date.parse(pair.refreshExpiresAt)).toBe(600_000)
    const access = await pool.query('SELECT token_hash FROM public.mobile_auth_access_tokens WHERE session_id=$1', [pair.sessionId])
    const refresh = await pool.query('SELECT token_hash FROM public.mobile_auth_refresh_tokens WHERE session_id=$1', [pair.sessionId])
    expect(access.rows).toEqual([{ token_hash: hash(pair.accessToken) }])
    expect(refresh.rows).toEqual([{ token_hash: hash(pair.refreshToken) }])
    expect(access.rows[0].token_hash).not.toBe(pair.accessToken)
    expect(refresh.rows[0].token_hash).not.toBe(pair.refreshToken)
    expect(await identify(pair.accessToken)).toMatchObject({ user: { id: ownerA }, sessionId: pair.sessionId })
    await expect(auth.signIn({ email: emailA, password: 'wrong-test-password-123' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    await expect(auth.signIn({ email: `missing-${ownerA}@mobile-test.example`, password })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    await expect(auth.signIn({ email: `x'OR'1'='1@mobile-test.example`, password })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
  })

  it('rotates refresh and access, retains replay evidence, and commits family revocation', async () => {
    const first = await loginA()
    const unrelated = await loginA()
    const next = await auth.refresh(first.refreshToken)
    expect(next.sessionId).toBe(first.sessionId)
    expect(next.accessToken).not.toBe(first.accessToken)
    expect(next.refreshToken).not.toBe(first.refreshToken)
    expect(next.sessionExpiresAt).toBe(first.sessionExpiresAt)
    await expect(identify(first.accessToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    expect((await identify(next.accessToken)).user.id).toBe(ownerA)
    const records = await pool.query('SELECT token_hash,consumed_at FROM public.mobile_auth_refresh_tokens WHERE session_id=$1', [first.sessionId])
    expect(records.rows).toHaveLength(2)
    expect(records.rows.find(row => row.token_hash === hash(first.refreshToken)).consumed_at).toBeInstanceOf(Date)
    // Replay remains detectable even after the consumed refresh's own expiry.
    await pool.query(`UPDATE public.mobile_auth_refresh_tokens SET created_at=clock_timestamp()-interval '2 seconds',
      expires_at=clock_timestamp()-interval '1 second' WHERE token_hash=$1`, [hash(first.refreshToken)])
    await expect(auth.refresh(first.refreshToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    await expect(identify(next.accessToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    await expect(auth.refresh(next.refreshToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    expect((await identify(unrelated.accessToken)).user.id).toBe(ownerA)
    const state = await pool.query(`SELECT revoked_at,(SELECT count(*)::int FROM public.mobile_auth_access_tokens
      WHERE session_id=$1) AS access_count FROM public.mobile_auth_sessions WHERE id=$1`, [first.sessionId])
    expect(state.rows[0].revoked_at).toBeInstanceOf(Date)
    expect(state.rows[0].access_count).toBe(0)
  })

  it('serializes concurrent refreshes: one wins, the replay revokes the winning family', async () => {
    const first = await loginA()
    const results = await Promise.allSettled([auth.refresh(first.refreshToken), auth.refresh(first.refreshToken)])
    const successes = results.filter(result => result.status === 'fulfilled')
    const failures = results.filter(result => result.status === 'rejected')
    expect(successes).toHaveLength(1)
    expect(failures).toHaveLength(1)
    if (successes[0].status !== 'fulfilled' || failures[0].status !== 'rejected') throw new Error('Unexpected result')
    expect(failures[0].reason).toMatchObject({ code: 'INVALID_TOKEN' })
    await expect(identify(successes[0].value.accessToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    await expect(auth.refresh(successes[0].value.refreshToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    const row = await pool.query('SELECT revoked_at FROM public.mobile_auth_sessions WHERE id=$1', [first.sessionId])
    expect(row.rows[0].revoked_at).toBeInstanceOf(Date)
  })

  it('detects replay even when connections default to repeatable-read isolation', async () => {
    const alternatePool = new Pool({ ...poolConfig, max: 2 })
    try {
      const [firstClient, secondClient] = await Promise.all([alternatePool.connect(), alternatePool.connect()])
      try {
        await Promise.all([firstClient.query("SET default_transaction_isolation TO 'repeatable read'"),
          secondClient.query("SET default_transaction_isolation TO 'repeatable read'")])
      } finally { firstClient.release(); secondClient.release() }
      const alternateAuth = createMobileAuth(alternatePool)
      const initial = await alternateAuth.signIn({ email: emailA, password })
      const results = await Promise.allSettled([alternateAuth.refresh(initial.refreshToken), alternateAuth.refresh(initial.refreshToken)])
      const winners = results.filter(result => result.status === 'fulfilled')
      const failures = results.filter(result => result.status === 'rejected')
      expect(winners).toHaveLength(1)
      expect(failures).toHaveLength(1)
      if (winners[0].status !== 'fulfilled' || failures[0].status !== 'rejected') throw new Error('Unexpected result')
      expect(failures[0].reason).toMatchObject({ code: 'INVALID_TOKEN' })
      await expect(identify(winners[0].value.accessToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    } finally { await alternatePool.end() }
  })

  it('does not let a concurrent refresh escape a successful revoke-all', async () => {
    const current = await loginA()
    const other = await loginA()
    const [revoked, rotated] = await Promise.allSettled([
      auth.revokeAll(current.accessToken), auth.refresh(other.refreshToken),
    ])
    expect(revoked.status).toBe('fulfilled')
    if (rotated.status === 'rejected') expect(rotated.reason).toMatchObject({ code: 'INVALID_TOKEN' })
    if (rotated.status === 'fulfilled') {
      await expect(identify(rotated.value.accessToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
      await expect(auth.refresh(rotated.value.refreshToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    }
    await expect(identify(current.accessToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    await expect(auth.refresh(other.refreshToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
  })

  it('enforces access, refresh and absolute session expiry against the database clock', async () => {
    const accessExpired = await loginA()
    await pool.query(`UPDATE public.mobile_auth_access_tokens SET created_at=clock_timestamp()-interval '2 seconds',
      expires_at=clock_timestamp()-interval '1 second' WHERE token_hash=$1`, [hash(accessExpired.accessToken)])
    await expect(identify(accessExpired.accessToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    const recovered = await auth.refresh(accessExpired.refreshToken)
    expect((await identify(recovered.accessToken)).user.id).toBe(ownerA)
    const refreshExpired = await loginA()
    await pool.query(`UPDATE public.mobile_auth_refresh_tokens SET created_at=clock_timestamp()-interval '2 seconds',
      expires_at=clock_timestamp()-interval '1 second' WHERE token_hash=$1`, [hash(refreshExpired.refreshToken)])
    await expect(auth.refresh(refreshExpired.refreshToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    const sessionExpired = await loginA()
    await pool.query(`UPDATE public.mobile_auth_sessions SET created_at=clock_timestamp()-interval '2 seconds',
      expires_at=clock_timestamp()-interval '1 second' WHERE id=$1`, [sessionExpired.sessionId])
    await expect(identify(sessionExpired.accessToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    await expect(auth.refresh(sessionExpired.refreshToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
  })

  it('clips rotated token lifetimes to the absolute family expiry', async () => {
    const first = await loginA()
    await pool.query(`UPDATE public.mobile_auth_sessions SET expires_at=clock_timestamp()+interval '20 seconds'
      WHERE id=$1`, [first.sessionId])
    const next = await auth.refresh(first.refreshToken)
    expect(next.accessExpiresAt).toBe(next.sessionExpiresAt)
    expect(next.refreshExpiresAt).toBe(next.sessionExpiresAt)
  })

  it('checks session ownership and isolates current logout and revoke-all', async () => {
    const a1 = await loginA()
    const a2 = await loginA()
    const b = await loginB()
    await expect(auth.revokeSession(b.accessToken, a1.sessionId)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect((await identify(a1.accessToken)).user.id).toBe(ownerA)
    await auth.revokeSession(a2.accessToken, a1.sessionId)
    await expect(identify(a1.accessToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    await expect(auth.refresh(a1.refreshToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    expect((await identify(a2.accessToken)).user.id).toBe(ownerA)
    const a3 = await loginA()
    await auth.logout(a2.accessToken)
    await expect(identify(a2.accessToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    expect((await identify(a3.accessToken)).user.id).toBe(ownerA)
    const a4 = await loginA()
    await auth.revokeAll(a3.accessToken)
    await expect(identify(a3.accessToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    await expect(identify(a4.accessToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    await expect(auth.refresh(a4.refreshToken)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    expect((await identify(b.accessToken)).user.id).toBe(ownerB)
  })

  it('rolls back authorized business work and sanitizes unexpected failures', async () => {
    const pair = await loginA()
    await expect(auth.withAuthorizedSession(pair.accessToken, async (principal, client) => {
      expect(principal.user.id).toBe(ownerA)
      await client.query('UPDATE public.users SET locale=$1 WHERE id=$2', ['changed', principal.user.id])
      throw new Error('internal secret detail')
    })).rejects.toMatchObject({ code: 'SERVER_ERROR', status: 503, message: 'Authentication is temporarily unavailable.' })
    const row = await pool.query('SELECT locale FROM public.users WHERE id=$1', [ownerA])
    expect(row.rows[0].locale).toBe('ko-KR')
    expect((await identify(pair.accessToken)).user.id).toBe(ownerA)
  })

  it('enables RLS and denies anonymous and authenticated table access', async () => {
    const result = await pool.query(`SELECT c.relname,c.relrowsecurity,
      has_table_privilege('anon',c.oid,'SELECT') AS anon_select,
      has_table_privilege('authenticated',c.oid,'SELECT') AS authenticated_select
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname=ANY($1::text[])`, [[
      'mobile_auth_sessions', 'mobile_auth_access_tokens', 'mobile_auth_refresh_tokens',
    ]])
    expect(result.rows).toHaveLength(3)
    for (const row of result.rows) expect(row).toMatchObject({ relrowsecurity: true, anon_select: false, authenticated_select: false })
  })
})
