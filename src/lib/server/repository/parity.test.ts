import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Repository } from './contract'
import { PostgresRepository } from './postgres'
import { SqliteRepository } from './sqlite'

const ownerA = `repository-a-${randomUUID()}`
const ownerB = `repository-b-${randomUUID()}`
const clock = () => new Date('2027-01-01T00:00:00.000Z')
const testUrl = process.env.NEXORA_REPOSITORY_TEST_POSTGRES_URL?.trim()
const isolatedUrl = 'postgresql://postgres@127.0.0.1:55432/nexora_test'
if (testUrl && testUrl !== isolatedUrl) throw new Error('Repository parity tests require the designated isolated test database.')

interface Harness {
  repo: Repository
  seedUser(id: string, email: string, locale: string): Promise<void>
  seedSession(token: string, userId: string, expiresAt: string): Promise<void>
  seedRecord(ownerId: string, kind: string, id: string, payload: unknown, createdAt: string): Promise<void>
  close(): Promise<void>
}

async function sqliteHarness(): Promise<Harness> {
  const db = new DatabaseSync(':memory:')
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE users(id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, locale TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL);
    CREATE TABLE records(owner_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(owner_id,kind,id));`)
  return {
    repo: new SqliteRepository(db, clock),
    async seedUser(id, email, locale) {
      db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id, email, `hash-${id}`, locale, '2026-11-16T01:02:03.004Z')
    },
    async seedSession(token, userId, expiresAt) {
      db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(token, userId, expiresAt)
    },
    async seedRecord(ownerId, kind, id, payload, createdAt) {
      db.prepare('INSERT INTO records VALUES(?,?,?,?,?)').run(ownerId, kind, id, JSON.stringify(payload), createdAt)
    },
    async close() { db.close() },
  }
}

async function postgresHarness(): Promise<Harness> {
  // This URL is deliberately not taken from any application or Supabase secret.
  if (!testUrl) throw new Error('NEXORA_REPOSITORY_TEST_POSTGRES_URL is required')
  const db = new Client({ connectionString: testUrl, connectionTimeoutMillis: 5000 })
  try {
    await db.connect()
    // Connection-local tables, never public: safe even with other test suites running.
    await db.query(`
      CREATE TEMP TABLE users(id text PRIMARY KEY, email text NOT NULL UNIQUE, password_hash text NOT NULL, locale text NOT NULL, created_at timestamptz NOT NULL);
      CREATE TEMP TABLE sessions(token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL);
      CREATE TEMP TABLE records(owner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind text NOT NULL, id text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL, PRIMARY KEY(owner_id,kind,id));`)
  } catch (error) {
    await db.end().catch(() => {})
    throw error
  }
  return {
    repo: new PostgresRepository(db, { schema: 'pg_temp', clock }),
    async seedUser(id, email, locale) {
      await db.query('INSERT INTO pg_temp.users VALUES($1,$2,$3,$4,$5)', [id, email, `hash-${id}`, locale, '2026-11-16T01:02:03.004Z'])
    },
    async seedSession(token, userId, expiresAt) {
      await db.query('INSERT INTO pg_temp.sessions VALUES($1,$2,$3)', [token, userId, expiresAt])
    },
    async seedRecord(ownerId, kind, id, payload, createdAt) {
      await db.query('INSERT INTO pg_temp.records VALUES($1,$2,$3,$4::jsonb,$5)', [ownerId, kind, id, JSON.stringify(payload), createdAt])
    },
    async close() { await db.end() },
  }
}

function sharedTests(makeHarness: () => Promise<Harness>) {
  let h: Harness | undefined

  beforeEach(async () => {
    h = await makeHarness()
    await h.seedUser(ownerA, 'a@example.test', 'ko-KR')
    await h.seedUser(ownerB, 'b@example.test', 'en-US')
  })
  afterEach(async () => {
    if (h) await h.close()
    h = undefined
  })
  const repo = () => h!.repo

  it('round-trips JSON objects, arrays, scalars and null like SQLite serialization', async () => {
    const values: unknown[] = [
      { korean: '한글', nested: [true, 0, null, { x: 'quote " and \\ slash' }], missing: undefined },
      ['one', 3, false, null], 'a JSON string', 0, false, null,
    ]
    for (const [index, value] of values.entries()) {
      await repo().saveRecord(ownerA, 'json', String(index), value)
      expect(await repo().getRecord(ownerA, 'json', String(index))).toEqual(JSON.parse(JSON.stringify(value)))
    }
    expect(await repo().listRecords(ownerA, 'json')).toEqual(values.map(value => JSON.parse(JSON.stringify(value))))
    expect(await repo().getRecord(ownerA, 'json', 'absent')).toBeNull()
    expect(await repo().listRecords(ownerA, 'absent')).toEqual([])
  })

  it('isolates owners and kinds even when record IDs coincide, including upserts', async () => {
    await h!.seedRecord(ownerA, 'asset', 'same', { private: 'A' }, '2026-01-01T00:00:00.000Z')
    await h!.seedRecord(ownerB, 'asset', 'same', { private: 'B' }, '2026-01-01T00:00:00.000Z')
    await h!.seedRecord(ownerA, 'profile', 'same', { private: 'profile A' }, '2026-01-01T00:00:00.000Z')
    await repo().saveRecord(ownerA, 'asset', 'same', { private: 'A updated' })
    expect(await repo().getRecord(ownerA, 'asset', 'same')).toEqual({ private: 'A updated' })
    expect(await repo().getRecord(ownerB, 'asset', 'same')).toEqual({ private: 'B' })
    expect(await repo().getRecord(ownerA, 'profile', 'same')).toEqual({ private: 'profile A' })
    expect(await repo().listRecords(ownerA, 'asset')).toEqual([{ private: 'A updated' }])
    expect(await repo().listRecords(ownerB, 'asset')).toEqual([{ private: 'B' }])
    expect(await repo().getRecord(`${ownerA}' OR 1=1 --`, 'asset', 'same')).toBeNull()
  })

  it('sorts by creation time then binary ID and retains creation time on upsert', async () => {
    await h!.seedRecord(ownerA, 'ordered', 'z', { id: 'z' }, '2026-01-02T00:00:00.000Z')
    await h!.seedRecord(ownerA, 'ordered', 'a', { id: 'a' }, '2026-01-02T00:00:00.000Z')
    await h!.seedRecord(ownerA, 'ordered', 'middle', { id: 'middle' }, '2026-01-03T00:00:00.000Z')
    await h!.seedRecord(ownerA, 'ordered', 'early', { id: 'early' }, '2026-01-01T00:00:00.000Z')
    await repo().saveRecord(ownerA, 'ordered', 'a', { id: 'a updated' })
    await repo().saveRecord(ownerA, 'ordered', 'new', { id: 'new' })
    expect(await repo().listRecords(ownerA, 'ordered')).toEqual([
      { id: 'early' }, { id: 'a updated' }, { id: 'z' }, { id: 'middle' }, { id: 'new' },
    ])
  })

  it('rejects unrepresentable top-level JSON without changing existing records', async () => {
    await repo().saveRecord(ownerA, 'data', 'id', { preserved: true })
    await expect(repo().saveRecord(ownerA, 'data', 'id', undefined)).rejects.toThrow()
    const circular: { self?: unknown } = {}
    circular.self = circular
    await expect(repo().saveRecord(ownerA, 'data', 'id', circular)).rejects.toThrow()
    await expect(repo().saveRecord(ownerA, 'data', 'id', BigInt(1))).rejects.toThrow()
    expect(await repo().getRecord(ownerA, 'data', 'id')).toEqual({ preserved: true })
  })

  it('finds exact users and normalizes user and session timestamps', async () => {
    await h!.seedSession('sha256-token-a', ownerA, '2026-11-17T02:00:00.000Z')
    const user = { id: ownerA, email: 'a@example.test', locale: 'ko-KR', passwordHash: `hash-${ownerA}`, createdAt: '2026-11-16T01:02:03.004Z' }
    expect(await repo().findUserById(ownerA)).toEqual(user)
    expect(await repo().findUserByEmail('a@example.test')).toEqual(user)
    expect(await repo().findUserByEmail('A@example.test')).toBeNull()
    expect(await repo().findUserById('missing')).toBeNull()
    expect(await repo().findSessionByTokenHash('sha256-token-a')).toEqual({ tokenHash: 'sha256-token-a', userId: ownerA, expiresAt: '2026-11-17T02:00:00.000Z' })
    expect(await repo().findSessionByTokenHash('missing')).toBeNull()
  })

  it('returns only the right public user for an unexpired hashed session and rejects expiry at the boundary', async () => {
    await h!.seedSession('sha256-token-a', ownerA, '2026-11-17T02:00:00.000Z')
    await h!.seedSession('sha256-token-b', ownerB, '2026-11-18T02:00:00.000Z')
    const before = new Date('2026-11-17T01:59:59.999Z')
    expect(await repo().findUserByActiveSession('sha256-token-a', before)).toEqual({ id: ownerA, email: 'a@example.test', locale: 'ko-KR' })
    expect(await repo().findUserByActiveSession('sha256-token-b', before)).toEqual({ id: ownerB, email: 'b@example.test', locale: 'en-US' })
    expect(await repo().findUserByActiveSession('sha256-token-a', new Date('2026-11-17T02:00:00.000Z'))).toBeNull()
    expect(await repo().findUserByActiveSession('sha256-token-a', new Date('2026-11-17T02:00:00.001Z'))).toBeNull()
    expect(await repo().findUserByActiveSession('not-the-hash', before)).toBeNull()
    expect(await repo().findUserByActiveSession('sha256-token-a')).toBeNull()
  })
}

describe('SQLite shared contract (in-memory)', () => sharedTests(sqliteHarness))
describe.skipIf(!testUrl)('PostgreSQL shared contract (requires NEXORA_REPOSITORY_TEST_POSTGRES_URL)', () => sharedTests(postgresHarness))
