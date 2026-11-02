import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { AppLocale, SessionUser } from '@/lib/business/types'
import { database, transaction } from './database'
import { HttpError, invalid, objectInput } from './errors'

const scrypt = promisify(scryptCallback)
const COOKIE = 'nexora_session'
const SESSION_SECONDS = 7 * 24 * 60 * 60
const digest = (value: string) => createHash('sha256').update(value).digest('hex')

export function limit(key: string, max: number, windowMs: number): void {
  const now = Date.now()
  const hashed = digest(key)
  transaction(() => {
    const db = database()
    const row = db.prepare('SELECT count,resets_at FROM rate_limits WHERE key=?').get(hashed) as
      { count: number; resets_at: number } | undefined
    if (!row || row.resets_at <= now) {
      db.prepare('INSERT OR REPLACE INTO rate_limits(key,count,resets_at) VALUES(?,?,?)').run(hashed, 1, now + windowMs)
    } else {
      if (row.count >= max) throw new HttpError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.')
      db.prepare('UPDATE rate_limits SET count=count+1 WHERE key=?').run(hashed)
    }
    // Opportunistic expiry avoids a permanent row for every attempted address.
    db.prepare('DELETE FROM rate_limits WHERE resets_at < ?').run(now - 24 * 60 * 60 * 1000)
  })
}

export function mutationGuard(request: Request): void {
  const actual = request.headers.get('origin')
  let expected: string
  try {
    expected = new URL(process.env.APP_ORIGIN || request.url).origin
  } catch {
    throw new HttpError(503, 'SERVER_CONFIGURATION', 'The application origin is not configured correctly.')
  }
  if (actual !== expected || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new HttpError(403, 'ORIGIN_REJECTED', 'This request must come from the application.')
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'JSON_REQUIRED', 'Send this request as JSON.')
  }
}

function cookieToken(request: Request): string | null {
  const cookie = request.headers.get('cookie')?.split(';').map(x => x.trim())
    .find(x => x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1)
  return cookie && /^[a-f0-9]{64}$/.test(cookie) ? cookie : null
}

export function currentUser(request: Request): SessionUser | null {
  const token = cookieToken(request)
  if (!token) return null
  const db = database()
  const row = db.prepare(`SELECT u.id,u.email,u.locale FROM users u JOIN sessions s ON s.user_id=u.id
    WHERE s.token_hash=? AND s.expires_at>?`).get(digest(token), new Date().toISOString()) as
    SessionUser | undefined
  return row || null
}

export function requireUser(request: Request): SessionUser {
  const user = currentUser(request)
  if (!user) throw new HttpError(401, 'AUTH_REQUIRED', 'Sign in to continue.')
  return user
}

function credentials(value: unknown): { email: string; password: string; locale: AppLocale } {
  const input = objectInput(value)
  if (typeof input.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    invalid('Enter a valid email address.')
  }
  if (typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 128) {
    invalid('Use a password between 12 and 128 characters.')
  }
  if (input.locale !== undefined && input.locale !== 'en-US' && input.locale !== 'ko-KR') invalid('Select a supported language.')
  return { email: input.email.trim().toLowerCase(), password: input.password, locale: input.locale === 'ko-KR' ? 'ko-KR' : 'en-US' }
}

export async function authenticate(value: unknown, register: boolean): Promise<SessionUser> {
  const { email, password } = credentials(value)
  limit('auth:global', 120, 60_000)
  limit(`auth:${email}`, 10, 15 * 60_000)
  const db = database()
  if (register) {
    const salt = randomBytes(16).toString('hex')
    const derived = await scrypt(password, salt, 64) as Buffer
    const user: SessionUser = { id: randomUUID(), email, locale: 'en-US' }
    try {
      db.prepare('INSERT INTO users(id,email,password_hash,locale,created_at) VALUES(?,?,?,?,?)')
        .run(user.id, user.email, `${salt}:${derived.toString('hex')}`, user.locale, new Date().toISOString())
    } catch (error) {
      if (error instanceof Error && 'code' in error && String(error.code).includes('SQLITE')) {
        throw new HttpError(409, 'ACCOUNT_UNAVAILABLE', 'Unable to create this account. Try signing in instead.')
      }
      throw error
    }
    return user
  }
  const row = db.prepare('SELECT id,email,locale,password_hash FROM users WHERE email=?').get(email) as
    (SessionUser & { password_hash: string }) | undefined
  // Run the same expensive derivation even for an unknown email.
  const [salt, expected] = row?.password_hash.split(':') || ['00000000000000000000000000000000', '00'.repeat(64)]
  const derived = await scrypt(password, salt, 64) as Buffer
  if (!row || !timingSafeEqual(derived, Buffer.from(expected, 'hex'))) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.')
  }
  return { id: row.id, email: row.email, locale: row.locale }
}

export function sessionCookie(request: Request, userId: string): string {
  const token = randomBytes(32).toString('hex')
  const db = database()
  db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(new Date().toISOString())
  db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)')
    .run(digest(token), userId, new Date(Date.now() + SESSION_SECONDS * 1000).toISOString())
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure(request)}`
}

function secure(request: Request): string {
  return process.env.NODE_ENV === 'production' || new URL(request.url).protocol === 'https:' ? '; Secure' : ''
}

export function logout(request: Request): string {
  const token = cookieToken(request)
  if (token) database().prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token))
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure(request)}`
}
