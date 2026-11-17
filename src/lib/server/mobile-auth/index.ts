import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { Pool, PoolClient } from 'pg'

const scrypt = promisify(scryptCallback)
const TOKEN = /^[0-9a-f]{64}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const DUMMY_SALT = '0'.repeat(32)
const DUMMY_HASH = '0'.repeat(128)

type ErrorCode = 'INVALID_INPUT' | 'INVALID_CREDENTIALS' | 'INVALID_TOKEN' | 'NOT_FOUND' | 'SERVER_ERROR'
export class MobileAuthError extends Error {
  constructor(public readonly code: ErrorCode, public readonly status: number, message: string) {
    super(message)
    this.name = 'MobileAuthError'
  }
}
const badInput = () => new MobileAuthError('INVALID_INPUT', 400, 'Invalid input.')
const badCredentials = () => new MobileAuthError('INVALID_CREDENTIALS', 401, 'The email or password is incorrect.')
const badToken = () => new MobileAuthError('INVALID_TOKEN', 401, 'Authentication required.')
const notFound = () => new MobileAuthError('NOT_FOUND', 404, 'Session not found.')
const serverError = () => new MobileAuthError('SERVER_ERROR', 503, 'Authentication is temporarily unavailable.')

export type MobileUser = { id: string; email: string; locale: string }
export type Principal = { user: MobileUser; sessionId: string }
export type TokenPair = Principal & {
  tokenType: 'Bearer'
  accessToken: string
  accessExpiresAt: string
  refreshToken: string
  refreshExpiresAt: string
  sessionExpiresAt: string
}
export type MobileAuthConfig = {
  accessTtlSeconds?: number
  refreshTtlSeconds?: number
  sessionTtlSeconds?: number
}

type Settings = Required<MobileAuthConfig>
type PasswordRow = MobileUser & { password_hash: string }
type OwnerRef = { owner_id: string; session_id: string }
type SessionRow = { id: string; expires_at: Date; revoked_at: Date | null }
type RefreshRow = { consumed_at: Date | null; expires_at: Date }

function settings(input: MobileAuthConfig = {}): Settings {
  const result = {
    accessTtlSeconds: input.accessTtlSeconds === undefined ? 900 : input.accessTtlSeconds,
    refreshTtlSeconds: input.refreshTtlSeconds === undefined ? 7 * 24 * 60 * 60 : input.refreshTtlSeconds,
    sessionTtlSeconds: input.sessionTtlSeconds === undefined ? 30 * 24 * 60 * 60 : input.sessionTtlSeconds,
  }
  if (!Number.isSafeInteger(result.accessTtlSeconds) || result.accessTtlSeconds < 30 || result.accessTtlSeconds > 900 ||
      !Number.isSafeInteger(result.refreshTtlSeconds) || result.refreshTtlSeconds < 300 || result.refreshTtlSeconds > 30 * 24 * 60 * 60 ||
      !Number.isSafeInteger(result.sessionTtlSeconds) || result.sessionTtlSeconds < result.refreshTtlSeconds ||
      result.sessionTtlSeconds < result.accessTtlSeconds || result.sessionTtlSeconds > 90 * 24 * 60 * 60) throw serverError()
  return result
}

function credentials(value: unknown): { email: string; password: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw badInput()
  const data = value as Record<string, unknown>
  if (typeof data.email !== 'string' || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) ||
      typeof data.password !== 'string' || data.password.length < 12 || data.password.length > 128) throw badInput()
  return { email: data.email.trim().toLowerCase(), password: data.password }
}
function parseToken(value: unknown): string {
  if (typeof value !== 'string' || !TOKEN.test(value)) throw badToken()
  return value
}
function parseSessionId(value: unknown): string {
  if (typeof value !== 'string' || !UUID.test(value)) throw notFound()
  return value
}
function hash(value: string): string { return createHash('sha256').update(value, 'utf8').digest('hex') }
function newToken(): string { return randomBytes(32).toString('hex') }
function iso(value: Date): string { return value.toISOString() }
function publicUser(row: MobileUser): MobileUser { return { id: row.id, email: row.email, locale: row.locale } }

// The legacy implementation passes the *hex salt string*, not decoded salt bytes, to scrypt.
async function verifyPassword(password: string, stored: unknown): Promise<boolean> {
  const valid = typeof stored === 'string' && /^[0-9a-f]{32}:[0-9a-f]{128}$/.test(stored)
  const [salt, expected] = valid ? (stored as string).split(':') : [DUMMY_SALT, DUMMY_HASH]
  const derived = await scrypt(password, salt, 64) as Buffer
  const matches = timingSafeEqual(derived, Buffer.from(expected, 'hex'))
  return valid && matches
}

// Strip database/driver errors, including connection strings and SQL details, at
// the library boundary. Never log credentials, tokens, SQL parameters or errors.
async function safe<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation() } catch (error) {
    if (error instanceof MobileAuthError) throw error
    throw serverError()
  }
}
async function transact<T>(pool: Pool, operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  let discard = false
  try {
    // Refresh must re-read the consumed token after waiting for the owner lock.
    // Force fresh statement snapshots even if the pool role defaults otherwise.
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    const result = await operation(client)
    try { await client.query('COMMIT') } catch (error) { discard = true; throw error }
    return result
  } catch (error) {
    try { await client.query('ROLLBACK') } catch { discard = true }
    throw error
  } finally {
    client.release(discard)
  }
}
async function dbNow(client: PoolClient): Promise<Date> {
  const result = await client.query<{ now: Date }>("SELECT date_trunc('milliseconds', clock_timestamp()) AS now")
  return result.rows[0].now
}
async function lockUser(client: PoolClient, ownerId: string): Promise<MobileUser | null> {
  const result = await client.query<MobileUser>('SELECT id,email,locale FROM public.users WHERE id=$1 FOR UPDATE', [ownerId])
  return result.rows[0] || null
}
async function lockSession(client: PoolClient, ownerId: string, sessionId: string): Promise<SessionRow | null> {
  const result = await client.query<SessionRow>(
    'SELECT id,expires_at,revoked_at FROM public.mobile_auth_sessions WHERE id=$1 AND owner_id=$2 FOR UPDATE',
    [sessionId, ownerId],
  )
  return result.rows[0] || null
}
async function createPair(client: PoolClient, config: Settings, user: MobileUser, session: SessionRow, now: Date): Promise<TokenPair> {
  const accessToken = newToken()
  const refreshToken = newToken()
  const access = await client.query<{ expires_at: Date }>(
    `INSERT INTO public.mobile_auth_access_tokens(token_hash,session_id,created_at,expires_at)
     VALUES ($1,$2,$3,LEAST($3::timestamptz + $4::integer * interval '1 second',$5::timestamptz)) RETURNING expires_at`,
    [hash(accessToken), session.id, now, config.accessTtlSeconds, session.expires_at],
  )
  const refresh = await client.query<{ expires_at: Date }>(
    `INSERT INTO public.mobile_auth_refresh_tokens(token_hash,session_id,created_at,expires_at)
     VALUES ($1,$2,$3,LEAST($3::timestamptz + $4::integer * interval '1 second',$5::timestamptz)) RETURNING expires_at`,
    [hash(refreshToken), session.id, now, config.refreshTtlSeconds, session.expires_at],
  )
  return {
    user: publicUser(user), sessionId: session.id, tokenType: 'Bearer', accessToken,
    accessExpiresAt: iso(access.rows[0].expires_at), refreshToken,
    refreshExpiresAt: iso(refresh.rows[0].expires_at), sessionExpiresAt: iso(session.expires_at),
  }
}
async function revokeFamily(client: PoolClient, sessionId: string): Promise<void> {
  await client.query('UPDATE public.mobile_auth_sessions SET revoked_at=COALESCE(revoked_at,clock_timestamp()) WHERE id=$1', [sessionId])
  await client.query('DELETE FROM public.mobile_auth_access_tokens WHERE session_id=$1', [sessionId])
}

// Every mutation acquires the user lock before its session lock. This ordering
// serializes refresh, access-authorized work, session creation, and revoke-all.
async function authorized(client: PoolClient, tokenHash: string): Promise<Principal> {
  const lookup = await client.query<OwnerRef>(
    `SELECT s.owner_id,s.id AS session_id FROM public.mobile_auth_access_tokens a
     JOIN public.mobile_auth_sessions s ON s.id=a.session_id WHERE a.token_hash=$1`, [tokenHash],
  )
  const ref = lookup.rows[0]
  if (!ref) throw badToken()
  const user = await lockUser(client, ref.owner_id)
  const session = user && await lockSession(client, user.id, ref.session_id)
  if (!user || !session || session.revoked_at) throw badToken()
  const active = await client.query<{ active: boolean }>(
    `SELECT (a.expires_at > clock_timestamp() AND s.expires_at > clock_timestamp() AND s.revoked_at IS NULL) AS active
     FROM public.mobile_auth_access_tokens a JOIN public.mobile_auth_sessions s ON s.id=a.session_id
     WHERE a.token_hash=$1 AND a.session_id=$2 AND s.owner_id=$3`, [tokenHash, session.id, user.id],
  )
  if (!active.rows[0]?.active) throw badToken()
  return { user: publicUser(user), sessionId: session.id }
}

/** Trusted server-side API only. Callers own the pool and TLS configuration. */
export function createMobileAuth(pool: Pool, config?: MobileAuthConfig) {
  let cfg: Settings
  try { cfg = settings(config) } catch { throw serverError() }
  return {
    signIn(input: unknown): Promise<TokenPair> {
      return safe(async () => {
        const { email, password } = credentials(input)
        const result = await pool.query<PasswordRow>(
          'SELECT id,email,locale,password_hash FROM public.users WHERE email=$1', [email],
        )
        const row = result.rows[0]
        const verified = await verifyPassword(password, row?.password_hash)
        if (!row || !verified) throw badCredentials()
        return transact(pool, async client => {
          const locked = await client.query<PasswordRow>(
            'SELECT id,email,locale,password_hash FROM public.users WHERE id=$1 FOR UPDATE', [row.id],
          )
          const user = locked.rows[0]
          // A concurrent credential change invalidates the earlier verification.
          if (!user || user.email !== email || user.password_hash !== row.password_hash) throw badCredentials()
          const now = await dbNow(client)
          const id = randomUUID()
          const session = await client.query<SessionRow>(
            `INSERT INTO public.mobile_auth_sessions(id,owner_id,created_at,expires_at)
             VALUES ($1,$2,$3,$3::timestamptz + $4::integer * interval '1 second') RETURNING id,expires_at,revoked_at`,
            [id, user.id, now, cfg.sessionTtlSeconds],
          )
          return createPair(client, cfg, user, session.rows[0], now)
        })
      })
    },

    refresh(value: unknown): Promise<TokenPair> {
      return safe(async () => {
        const tokenHash = hash(parseToken(value))
        const outcome = await transact(pool, async client => {
          const lookup = await client.query<OwnerRef>(
            `SELECT s.owner_id,s.id AS session_id FROM public.mobile_auth_refresh_tokens r
             JOIN public.mobile_auth_sessions s ON s.id=r.session_id WHERE r.token_hash=$1`, [tokenHash],
          )
          const ref = lookup.rows[0]
          if (!ref) return null
          const user = await lockUser(client, ref.owner_id)
          const session = user && await lockSession(client, user.id, ref.session_id)
          if (!user || !session) return null
          const token = await client.query<RefreshRow>(
            'SELECT consumed_at,expires_at FROM public.mobile_auth_refresh_tokens WHERE token_hash=$1 AND session_id=$2',
            [tokenHash, session.id],
          )
          const current = token.rows[0]
          if (!current) return null
          if (current.consumed_at) {
            // Return an outcome, rather than throwing: the revocation MUST commit.
            await revokeFamily(client, session.id)
            return null
          }
          const now = await dbNow(client)
          if (session.revoked_at || session.expires_at <= now || current.expires_at <= now) return null
          await client.query('UPDATE public.mobile_auth_refresh_tokens SET consumed_at=$2 WHERE token_hash=$1 AND session_id=$3',
            [tokenHash, now, session.id])
          // Rotation invalidates earlier access tokens too.
          await client.query('DELETE FROM public.mobile_auth_access_tokens WHERE session_id=$1', [session.id])
          return createPair(client, cfg, user, session, now)
        })
        if (!outcome) throw badToken()
        return outcome
      })
    },

    /** Hold authorization locks during a trusted owner-scoped DB operation. */
    withAuthorizedSession<T>(value: unknown, operation: (principal: Principal, client: PoolClient) => Promise<T>): Promise<T> {
      return safe(async () => {
        const tokenHash = hash(parseToken(value))
        if (typeof operation !== 'function') throw badInput()
        return transact(pool, async client => operation(await authorized(client, tokenHash), client))
      })
    },

    /** Revoke the current family, including all access tokens. */
    logout(value: unknown): Promise<void> {
      return safe(async () => {
        const tokenHash = hash(parseToken(value))
        await transact(pool, async client => {
          const principal = await authorized(client, tokenHash)
          await revokeFamily(client, principal.sessionId)
        })
      })
    },

    /** Revoke one owned family; another owner's UUID is indistinguishable from missing. */
    revokeSession(value: unknown, target: unknown): Promise<void> {
      return safe(async () => {
        const tokenHash = hash(parseToken(value))
        const targetId = parseSessionId(target)
        await transact(pool, async client => {
          const principal = await authorized(client, tokenHash)
          const session = await lockSession(client, principal.user.id, targetId)
          if (!session) throw notFound()
          await revokeFamily(client, session.id)
        })
      })
    },

    /** Revoke all families belonging to the authenticated owner, not a client-supplied owner. */
    revokeAll(value: unknown): Promise<void> {
      return safe(async () => {
        const tokenHash = hash(parseToken(value))
        await transact(pool, async client => {
          const principal = await authorized(client, tokenHash)
          await client.query('UPDATE public.mobile_auth_sessions SET revoked_at=COALESCE(revoked_at,clock_timestamp()) WHERE owner_id=$1', [principal.user.id])
          await client.query(`DELETE FROM public.mobile_auth_access_tokens a USING public.mobile_auth_sessions s
            WHERE a.session_id=s.id AND s.owner_id=$1`, [principal.user.id])
        })
      })
    },
  }
}
