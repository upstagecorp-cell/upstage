import type { SessionRow, StoredSession, StoredUser, UserRow } from './contract'

/** JSON.stringify is deliberately shared with the legacy SQLite repository. */
export function serializePayload(value: unknown): string {
  const serialized = JSON.stringify(value)
  if (serialized === undefined) throw new TypeError('Record value must be JSON-serializable')
  return serialized
}

export function deserializePayload<T>(payload: string): T {
  return JSON.parse(payload) as T
}

function isoTimestamp(value: string | Date): string {
  return (value instanceof Date ? value : new Date(value)).toISOString()
}

export function userFromRow(row: UserRow): StoredUser {
  return {
    id: row.id,
    email: row.email,
    locale: row.locale,
    passwordHash: row.password_hash,
    createdAt: isoTimestamp(row.created_at),
  }
}

export function sessionFromRow(row: SessionRow): StoredSession {
  return {
    tokenHash: row.token_hash,
    userId: row.user_id,
    expiresAt: isoTimestamp(row.expires_at),
  }
}
