import { readFile } from 'node:fs/promises'
import { Client } from 'pg'

const connectionString = process.env.SUPABASE_DATABASE_URL?.trim()
if (!connectionString) throw new Error('SUPABASE_DATABASE_URL is required')

const migrationPath = new URL('../supabase/migrations/20261116000000_initial_nexora.sql', import.meta.url)
const sql = await readFile(migrationPath, 'utf8')
const client = new Client({
  connectionString,
  connectionTimeoutMillis: 10_000,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  await client.query('begin')
  await client.query(sql)
  await client.query('commit')
  const result = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('schema_migrations', 'users', 'sessions', 'records', 'generation_keys', 'rate_limits', 'billing_customers', 'billing_events', 'account_tokens')
    order by table_name
  `)
  console.log(JSON.stringify({ applied: true, tables: result.rows.map(row => row.table_name) }))
} catch (error) {
  try { await client.query('rollback') } catch {}
  console.error(error instanceof Error ? error.message : 'Supabase migration failed')
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
