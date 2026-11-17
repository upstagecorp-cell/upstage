import type { AppLocale, SessionUser } from '@/lib/business/types'

/** Server-only data, including a password hash. Do not return this to clients. */
export interface StoredUser extends SessionUser {
  passwordHash: string
  createdAt: string
}

export interface StoredSession {
  tokenHash: string
  userId: string
  expiresAt: string
}

/**
 * Minimal asynchronous storage primitives, not an authorization or transaction API.
 * Callers must authenticate and authorize ownerId before each record operation.
 */
export interface Repository {
  saveRecord(ownerId: string, kind: string, id: string, value: unknown): Promise<void>
  getRecord<T = unknown>(ownerId: string, kind: string, id: string): Promise<T | null>
  /** Oldest createdAt first, then binary id order for equal timestamps. */
  listRecords<T = unknown>(ownerId: string, kind: string): Promise<T[]>
  findUserById(id: string): Promise<StoredUser | null>
  /** Exact, case-sensitive match; callers perform their existing email normalization. */
  findUserByEmail(email: string): Promise<StoredUser | null>
  /** Includes expired sessions; the argument is a hash, never the raw cookie token. */
  findSessionByTokenHash(tokenHash: string): Promise<StoredSession | null>
  /** Returns only the public session user if expiresAt is strictly after asOf. */
  findUserByActiveSession(tokenHash: string, asOf?: Date): Promise<SessionUser | null>
}

export interface UserRow {
  id: string
  email: string
  password_hash: string
  locale: AppLocale
  created_at: string | Date
}

export interface SessionRow {
  token_hash: string
  user_id: string
  expires_at: string | Date
}
