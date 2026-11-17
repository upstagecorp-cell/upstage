import type { Pool } from 'pg'
import type { SessionUser } from '@/lib/business/types'
import type { Repository, SessionRow, StoredSession, StoredUser, UserRow } from './contract'
import { deserializePayload, serializePayload, sessionFromRow, userFromRow } from './conversion'

/** A pg Pool, Client, or acquired PoolClient can be supplied; its lifecycle belongs to the caller. */
export class PostgresRepository implements Repository {
  private readonly schema: string

  constructor(
    private readonly db: Pick<Pool, 'query'>,
    options: { schema?: string; clock?: () => Date } = {},
  ) {
    const schema = options.schema ?? 'public'
    // Identifiers cannot be bound as values. Never interpolate an unchecked schema.
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) throw new TypeError('Invalid PostgreSQL schema name')
    this.schema = `"${schema}"`
    this.clock = options.clock ?? (() => new Date())
  }

  private readonly clock: () => Date

  async saveRecord(ownerId: string, kind: string, id: string, value: unknown): Promise<void> {
    const payload = serializePayload(value)
    await this.db.query(`INSERT INTO ${this.schema}.records(owner_id,kind,id,payload,created_at) VALUES($1,$2,$3,$4::jsonb,$5)
      ON CONFLICT(owner_id,kind,id) DO UPDATE SET payload=excluded.payload`,
    [ownerId, kind, id, payload, this.clock().toISOString()])
  }

  async getRecord<T = unknown>(ownerId: string, kind: string, id: string): Promise<T | null> {
    // Cast jsonb to text: pg otherwise returns JSON string scalars as unquoted JS strings.
    const result = await this.db.query<{ payload: string }>(
      `SELECT payload::text AS payload FROM ${this.schema}.records WHERE owner_id=$1 AND kind=$2 AND id=$3`,
      [ownerId, kind, id],
    )
    return result.rows[0] ? deserializePayload<T>(result.rows[0].payload) : null
  }

  async listRecords<T = unknown>(ownerId: string, kind: string): Promise<T[]> {
    const result = await this.db.query<{ payload: string }>(
      `SELECT payload::text AS payload FROM ${this.schema}.records WHERE owner_id=$1 AND kind=$2
        ORDER BY created_at, id COLLATE "C"`, [ownerId, kind],
    )
    return result.rows.map(row => deserializePayload<T>(row.payload))
  }

  async findUserById(id: string): Promise<StoredUser | null> {
    const result = await this.db.query<UserRow>(
      `SELECT id,email,password_hash,locale,created_at FROM ${this.schema}.users WHERE id=$1`, [id],
    )
    return result.rows[0] ? userFromRow(result.rows[0]) : null
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const result = await this.db.query<UserRow>(
      `SELECT id,email,password_hash,locale,created_at FROM ${this.schema}.users WHERE email=$1`, [email],
    )
    return result.rows[0] ? userFromRow(result.rows[0]) : null
  }

  async findSessionByTokenHash(tokenHash: string): Promise<StoredSession | null> {
    const result = await this.db.query<SessionRow>(
      `SELECT token_hash,user_id,expires_at FROM ${this.schema}.sessions WHERE token_hash=$1`, [tokenHash],
    )
    return result.rows[0] ? sessionFromRow(result.rows[0]) : null
  }

  async findUserByActiveSession(tokenHash: string, asOf: Date = this.clock()): Promise<SessionUser | null> {
    const result = await this.db.query<SessionUser>(
      `SELECT u.id,u.email,u.locale FROM ${this.schema}.users u JOIN ${this.schema}.sessions s ON s.user_id=u.id
        WHERE s.token_hash=$1 AND s.expires_at>$2`, [tokenHash, asOf.toISOString()],
    )
    return result.rows[0] ?? null
  }
}
