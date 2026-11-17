import { scryptSync } from 'node:crypto'
import type { Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'
import { createMobileAuth, MobileAuthError } from './index'

const password = 'unit-test-password-123'
const salt = '1234567890abcdef1234567890abcdef'
const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
const noConnect = () => { throw new Error('should not connect') }
function fakePool(rows: unknown[] = []) {
  return {
    query: vi.fn().mockResolvedValue({ rows }),
    connect: vi.fn(noConnect),
  } as unknown as Pool
}

describe('mobile authentication validation and safety', () => {
  it('enforces bounded, server-side TTL configuration', () => {
    const pool = fakePool()
    for (const cfg of [
      { accessTtlSeconds: 0 }, { accessTtlSeconds: 901 }, { accessTtlSeconds: NaN },
      { accessTtlSeconds: Infinity }, { accessTtlSeconds: 30.5 },
      { accessTtlSeconds: null }, { refreshTtlSeconds: 299 }, { refreshTtlSeconds: 30 * 86400 + 1 },
      { sessionTtlSeconds: 90 * 86400 + 1 }, { sessionTtlSeconds: 600, refreshTtlSeconds: 601 },
      { sessionTtlSeconds: '800' },
    ]) {
      expect(() => createMobileAuth(pool, cfg as never)).toThrow(MobileAuthError)
    }
    expect(() => createMobileAuth(pool, { accessTtlSeconds: 30, refreshTtlSeconds: 300, sessionTtlSeconds: 300 })).not.toThrow()
  })

  it('rejects invalid credential shapes and oversized or invalid inputs before any SQL', async () => {
    const pool = fakePool()
    const auth = createMobileAuth(pool)
    for (const input of [null, [], 'bad', {}, { email: 'nope', password },
      { email: 'a'.repeat(255) + '@example.com', password },
      { email: 'a@example.com', password: 'short' },
      { email: 'a@example.com', password: 'x'.repeat(129) },
      { email: 'a@example.com', password: 123456789012 }]) {
      await expect(auth.signIn(input)).rejects.toMatchObject({ code: 'INVALID_INPUT', status: 400 })
    }
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('normalizes email, parameterizes SQL, and gives the same error for unknown and malformed credential hashes', async () => {
    const email = "test'or'1'='1@example.com"
    const pool = fakePool()
    const auth = createMobileAuth(pool)
    await expect(auth.signIn({ email: `  ${email.toUpperCase()}  `, password })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 })
    expect(pool.query).toHaveBeenCalledWith('SELECT id,email,locale,password_hash FROM public.users WHERE email=$1', [email])
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ id: 'a', email, locale: 'en-US', password_hash: 'bad' }] } as never)
    await expect(auth.signIn({ email, password })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 })
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ id: 'a', email, locale: 'en-US', password_hash: passwordHash }] } as never)
    await expect(auth.signIn({ email, password: 'wrong-test-password' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 })
    expect(pool.connect).not.toHaveBeenCalled()
  })

  it('rejects a login if the password changes after verification and rolls back', async () => {
    const row = { id: 'owner', email: 'a@example.com', locale: 'en-US', password_hash: passwordHash }
    const client = {
      query: vi.fn(async (sql: string) => ({ rows: sql.includes('FROM public.users') ? [{ ...row, password_hash: 'changed' }] : [] })),
      release: vi.fn(),
    }
    const pool = { query: vi.fn().mockResolvedValue({ rows: [row] }), connect: vi.fn().mockResolvedValue(client) } as unknown as Pool
    await expect(createMobileAuth(pool).signIn({ email: row.email, password })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(client.query.mock.calls.map(call => call[0])).toEqual([
      'BEGIN ISOLATION LEVEL READ COMMITTED', 'SELECT id,email,locale,password_hash FROM public.users WHERE id=$1 FOR UPDATE', 'ROLLBACK',
    ])
    expect(client.release).toHaveBeenCalledWith(false)
  })

  it('discards a connection if rollback fails and hides driver errors', async () => {
    const client = {
      query: vi.fn(async (sql: string) => {
        if (sql !== 'BEGIN ISOLATION LEVEL READ COMMITTED') throw new Error('private database error')
        return { rows: [] }
      }),
      release: vi.fn(),
    }
    const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pool
    await expect(createMobileAuth(pool).refresh('a'.repeat(64))).rejects.toMatchObject({ code: 'SERVER_ERROR', status: 503 })
    expect(client.release).toHaveBeenCalledWith(true)
  })

  it('rejects malformed tokens and session identifiers before SQL', async () => {
    const pool = fakePool()
    const auth = createMobileAuth(pool)
    for (const token of [undefined, null, '', 'f'.repeat(63), 'F'.repeat(64), 'g'.repeat(64), 'f'.repeat(65), { token: 'f'.repeat(64) }]) {
      await expect(auth.refresh(token)).rejects.toMatchObject({ code: 'INVALID_TOKEN', status: 401 })
      await expect(auth.logout(token)).rejects.toMatchObject({ code: 'INVALID_TOKEN', status: 401 })
      await expect(auth.withAuthorizedSession(token, async () => 1)).rejects.toMatchObject({ code: 'INVALID_TOKEN', status: 401 })
    }
    await expect(auth.revokeSession('f'.repeat(64), "' OR true --")).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(pool.connect).not.toHaveBeenCalled()
  })

  it('sanitizes driver and unexpected input errors without logging secrets', async () => {
    const pool = fakePool()
    const auth = createMobileAuth(pool)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      vi.mocked(pool.query).mockRejectedValueOnce(new Error('sensitive-database-details password=' + password))
      await expect(auth.signIn({ email: 'a@example.com', password })).rejects.toMatchObject({
        code: 'SERVER_ERROR', status: 503, message: 'Authentication is temporarily unavailable.',
      })
      const input = { get email() { throw new Error('secret token value') }, password }
      await expect(auth.signIn(input)).rejects.toMatchObject({ code: 'SERVER_ERROR', status: 503 })
      expect(log).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally { log.mockRestore(); error.mockRestore() }
  })
})
