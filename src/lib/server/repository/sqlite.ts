import type { DatabaseSync } from 'node:sqlite'
import type { SessionUser } from '@/lib/business/types'
import type { Repository, SessionRow, StoredSession, StoredUser, UserRow } from './contract'
import { deserializePayload, serializePayload, sessionFromRow, userFromRow } from './conversion'

type PayloadRow = { payload: string }

/** Does not open, migrate, close, or otherwise own the supplied database. */
export class SqliteRepository implements Repository {
  constructor(private readonly db: DatabaseSync, private readonly clock: () => Date = () => new Date()) {}

  async saveRecord(ownerId: string, kind: string, id: string, value: unknown): Promise<void> {
    const payload = serializePayload(value)
    this.db.prepare(`INSERT INTO records(owner_id,kind,id,payload,created_at) VALUES(?,?,?,?,?)
      ON CONFLICT(owner_id,kind,id) DO UPDATE SET payload=excluded.payload`)
      .run(ownerId, kind, id, payload, this.clock().toISOString())
  }

  async getRecord<T = unknown>(ownerId: string, kind: string, id: string): Promise<T | null> {
    const row = this.db.prepare('SELECT payload FROM records WHERE owner_id=? AND kind=? AND id=?')
      .get(ownerId, kind, id) as PayloadRow | undefined
    return row ? deserializePayload<T>(row.payload) : null
  }

  async listRecords<T = unknown>(ownerId: string, kind: string): Promise<T[]> {
    const rows = this.db.prepare(`SELECT payload FROM records WHERE owner_id=? AND kind=?
      ORDER BY created_at, id COLLATE BINARY`).all(ownerId, kind) as PayloadRow[]
    return rows.map(row => deserializePayload<T>(row.payload))
  }

  async findUserById(id: string): Promise<StoredUser | null> {
    const row = this.db.prepare('SELECT id,email,password_hash,locale,created_at FROM users WHERE id=?')
      .get(id) as unknown as UserRow | undefined
    return row ? userFromRow(row) : null
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const row = this.db.prepare('SELECT id,email,password_hash,locale,created_at FROM users WHERE email=?')
      .get(email) as unknown as UserRow | undefined
    return row ? userFromRow(row) : null
  }

  async findSessionByTokenHash(tokenHash: string): Promise<StoredSession | null> {
    const row = this.db.prepare('SELECT token_hash,user_id,expires_at FROM sessions WHERE token_hash=?')
      .get(tokenHash) as unknown as SessionRow | undefined
    return row ? sessionFromRow(row) : null
  }

  async findUserByActiveSession(tokenHash: string, asOf: Date = this.clock()): Promise<SessionUser | null> {
    const row = this.db.prepare(`SELECT u.id,u.email,u.locale FROM users u JOIN sessions s ON s.user_id=u.id
      WHERE s.token_hash=? AND s.expires_at>?`).get(tokenHash, asOf.toISOString()) as unknown as SessionUser | undefined
    return row ?? null
  }
}
