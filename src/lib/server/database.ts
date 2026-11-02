import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { ExecutionJob, UsageRecord, WorkspaceData } from '@/lib/business/types'

const databases = new Map<string, DatabaseSync>()

/** Local, additive migration. Existing browser data is imported only on explicit request. */
export function database(): DatabaseSync {
  const path = process.env.NEXORA_DB_PATH || resolve(process.cwd(), '.data', 'nexora.sqlite')
  const existing = databases.get(path)
  if (existing) return existing
  if (path !== ':memory:') mkdirSync(dirname(resolve(/* turbopackIgnore: true */ path)), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      locale TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS records (
      owner_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, id TEXT NOT NULL,
      payload TEXT NOT NULL, created_at TEXT NOT NULL,
      PRIMARY KEY(owner_id,kind,id)
    );
    CREATE TABLE IF NOT EXISTS generation_keys (
      owner_id TEXT NOT NULL REFERENCES users(id), key TEXT NOT NULL,
      payload_hash TEXT NOT NULL, job_id TEXT NOT NULL,
      PRIMARY KEY(owner_id,key)
    );
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY, count INTEGER NOT NULL, resets_at INTEGER NOT NULL
    );
    INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
  `)
  databases.set(path, db)
  return db
}

export function transaction<T>(operation: () => T): T {
  const db = database()
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = operation()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

export function saveRecord(owner: string, kind: string, id: string, value: unknown): void {
  database().prepare(`INSERT INTO records(owner_id,kind,id,payload,created_at) VALUES(?,?,?,?,?)
    ON CONFLICT(owner_id,kind,id) DO UPDATE SET payload=excluded.payload`).run(
    owner, kind, id, JSON.stringify(value), new Date().toISOString(),
  )
}

export function getRecord<T>(owner: string, kind: string, id: string): T | null {
  const row = database().prepare('SELECT payload FROM records WHERE owner_id=? AND kind=? AND id=?')
    .get(owner, kind, id) as { payload: string } | undefined
  return row ? JSON.parse(row.payload) as T : null
}

export function listRecords<T>(owner: string, kind: string): T[] {
  const rows = database().prepare('SELECT payload FROM records WHERE owner_id=? AND kind=? ORDER BY created_at,rowid')
    .all(owner, kind) as { payload: string }[]
  return rows.map(row => JSON.parse(row.payload) as T)
}

export function generationConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim() && process.env.OPENAI_MODEL?.trim())
}

export function workspace(owner: string): WorkspaceData {
  recoverInterruptedJobs(owner)
  return {
    profile: getRecord(owner, 'profile', 'current'),
    evidence: listRecords(owner, 'evidence'),
    assessments: listRecords(owner, 'assessment'),
    jobs: listRecords(owner, 'job'),
    assets: listRecords(owner, 'asset'),
    executions: listRecords(owner, 'execution'),
    results: listRecords(owner, 'result'),
    usage: listRecords(owner, 'usage'),
    legacyImport: getRecord(owner, 'legacy', 'current'),
    generationAvailable: generationConfigured(),
    weeklyPlans: listRecords(owner, 'weekly_plan'),
  }
}

function recoverInterruptedJobs(owner: string): void {
  // A process interruption can leave an uncommitted provider outcome. Never replay it automatically.
  const stale = listRecords<ExecutionJob>(owner, 'job').filter(job =>
    job.status === 'running' && Date.now() - Date.parse(job.createdAt) > 10 * 60_000)
  if (!stale.length) return
  transaction(() => {
    for (const candidate of stale) {
      const job = getRecord<ExecutionJob>(owner, 'job', candidate.id)
      if (!job || job.status !== 'running') continue
      const recordedAt = new Date().toISOString()
      saveRecord(owner, 'job', job.id, { ...job, status: 'failed', errorCode: 'JOB_INTERRUPTED', completedAt: recordedAt })
      const usage: UsageRecord = { id: randomUUID(), jobId: job.id, operation: 'marketing_package', provider: job.provider, model: job.model, status: 'failed', inputTokens: null, outputTokens: null, estimated: true, recordedAt }
      saveRecord(owner, 'usage', job.id, usage)
    }
  })
}

/** Only used by isolated tests, never deletes persisted data. */
export function closeDatabases(): void {
  for (const db of databases.values()) db.close()
  databases.clear()
}
