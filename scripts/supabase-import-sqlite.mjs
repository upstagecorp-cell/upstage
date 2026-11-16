import { DatabaseSync } from 'node:sqlite'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Client } from 'pg'

const sqlitePath = process.env.NEXORA_DB_PATH || resolve(process.cwd(), '.data', 'nexora.sqlite')
if (!existsSync(sqlitePath)) {
  console.log(JSON.stringify({ imported: false, reason: 'sqlite_database_not_found', path: sqlitePath }))
  process.exit(0)
}
const connectionString = process.env.SUPABASE_DATABASE_URL?.trim()
if (!connectionString) throw new Error('SUPABASE_DATABASE_URL is required')

const sqlite = new DatabaseSync(sqlitePath)
const pg = new Client({ connectionString, connectionTimeoutMillis: 10_000, ssl: { rejectUnauthorized: false } })
const count = (table) => Number(sqlite.prepare(`select count(*) as n from ${table}`).get().n)

try {
  await pg.connect()
  await pg.query('begin')
  for (const row of sqlite.prepare('select id,email,password_hash,locale,created_at from users').all()) {
    await pg.query(`insert into public.users(id,email,password_hash,locale,created_at) values($1,$2,$3,$4,$5) on conflict(id) do update set email=excluded.email,password_hash=excluded.password_hash,locale=excluded.locale,created_at=excluded.created_at`, [row.id, row.email, row.password_hash, row.locale, row.created_at])
  }
  for (const row of sqlite.prepare('select token_hash,user_id,expires_at from sessions').all()) {
    await pg.query(`insert into public.sessions(token_hash,user_id,expires_at) values($1,$2,$3) on conflict(token_hash) do update set user_id=excluded.user_id,expires_at=excluded.expires_at`, [row.token_hash, row.user_id, row.expires_at])
  }
  for (const row of sqlite.prepare('select owner_id,kind,id,payload,created_at from records').all()) {
    await pg.query(`insert into public.records(owner_id,kind,id,payload,created_at) values($1,$2,$3,$4::jsonb,$5) on conflict(owner_id,kind,id) do update set payload=excluded.payload,created_at=excluded.created_at`, [row.owner_id, row.kind, row.id, row.payload, row.created_at])
  }
  for (const row of sqlite.prepare('select owner_id,key,payload_hash,job_id from generation_keys').all()) {
    await pg.query(`insert into public.generation_keys(owner_id,key,payload_hash,job_id) values($1,$2,$3,$4) on conflict(owner_id,key) do update set payload_hash=excluded.payload_hash,job_id=excluded.job_id`, [row.owner_id, row.key, row.payload_hash, row.job_id])
  }
  for (const row of sqlite.prepare('select key,count,resets_at from rate_limits').all()) {
    await pg.query(`insert into public.rate_limits(key,count,resets_at) values($1,$2,$3) on conflict(key) do update set count=excluded.count,resets_at=excluded.resets_at`, [row.key, row.count, row.resets_at])
  }
  for (const row of sqlite.prepare('select owner_id,customer_id,revision,applied_revision,checkout_key,checkout_plan,checkout_expires from billing_customers').all()) {
    await pg.query(`insert into public.billing_customers(owner_id,customer_id,revision,applied_revision,checkout_key,checkout_plan,checkout_expires) values($1,$2,$3,$4,$5,$6,$7) on conflict(owner_id) do update set customer_id=excluded.customer_id,revision=excluded.revision,applied_revision=excluded.applied_revision,checkout_key=excluded.checkout_key,checkout_plan=excluded.checkout_plan,checkout_expires=excluded.checkout_expires`, [row.owner_id, row.customer_id, row.revision, row.applied_revision, row.checkout_key, row.checkout_plan, row.checkout_expires])
  }
  for (const row of sqlite.prepare('select id,processed_at from billing_events').all()) {
    await pg.query(`insert into public.billing_events(id,processed_at) values($1,$2) on conflict(id) do nothing`, [row.id, row.processed_at])
  }
  for (const row of sqlite.prepare('select token_hash,owner_id,purpose,expires_at,created_at from account_tokens').all()) {
    await pg.query(`insert into public.account_tokens(token_hash,owner_id,purpose,expires_at,created_at) values($1,$2,$3,$4,$5) on conflict(token_hash) do update set owner_id=excluded.owner_id,purpose=excluded.purpose,expires_at=excluded.expires_at,created_at=excluded.created_at`, [row.token_hash, row.owner_id, row.purpose, row.expires_at, row.created_at])
  }
  await pg.query('commit')
  console.log(JSON.stringify({ imported: true, rows: { users: count('users'), sessions: count('sessions'), records: count('records'), generation_keys: count('generation_keys'), rate_limits: count('rate_limits'), billing_customers: count('billing_customers'), billing_events: count('billing_events'), account_tokens: count('account_tokens') } }))
} catch (error) {
  try { await pg.query('rollback') } catch {}
  console.error(error instanceof Error ? error.message : 'SQLite import failed')
  process.exitCode = 1
} finally {
  sqlite.close()
  await pg.end().catch(() => {})
}
