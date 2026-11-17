import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { closeDatabases, database, getRecord, listRecords, saveRecord } from '../database'
import { SqliteRepository } from './sqlite'

describe('existing SQLite compatibility', () => {
  beforeEach(() => {
    closeDatabases()
    vi.stubEnv('NEXORA_DB_PATH', ':memory:')
    vi.useFakeTimers({ toFake: ['Date'] })
    database().prepare('INSERT INTO users(id,email,password_hash,locale,created_at) VALUES(?,?,?,?,?)')
      .run('owner', 'owner@example.test', 'hash', 'en-US', '2026-01-01T00:00:00.000Z')
  })
  afterEach(() => {
    closeDatabases()
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  it('reads and updates records created by the current repository without changing their creation time', async () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    saveRecord('owner', 'asset', 'first', { title: 'original', nested: ['한글', null] })
    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'))
    saveRecord('owner', 'asset', 'second', { title: 'second' })
    const repo = new SqliteRepository(database())
    expect(await repo.getRecord('owner', 'asset', 'first')).toEqual(getRecord('owner', 'asset', 'first'))
    expect(await repo.listRecords('owner', 'asset')).toEqual(listRecords('owner', 'asset'))
    await repo.saveRecord('owner', 'asset', 'first', { title: 'updated' })
    expect(getRecord('owner', 'asset', 'first')).toEqual({ title: 'updated' })
    expect(await repo.listRecords('owner', 'asset')).toEqual(listRecords('owner', 'asset'))
    expect(listRecords('owner', 'asset')).toEqual([{ title: 'updated' }, { title: 'second' }])
  })

  it('documents the intentional ID tie-break difference from legacy rowid order', async () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    saveRecord('owner', 'asset', 'z', { id: 'z' })
    saveRecord('owner', 'asset', 'a', { id: 'a' })
    expect(listRecords('owner', 'asset')).toEqual([{ id: 'z' }, { id: 'a' }])
    expect(await new SqliteRepository(database()).listRecords('owner', 'asset')).toEqual([{ id: 'a' }, { id: 'z' }])
  })
})
