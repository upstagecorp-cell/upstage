import { afterEach, describe, expect, it, vi } from 'vitest'

// Any pool creation in these rejection tests is a failure; no DB connection is made.
vi.mock('pg', () => ({
  Pool: class {
    constructor() { throw new Error('Pool created before URL validation') }
  },
}))

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

describe('mobile integration test URL opt-in', () => {
  it.each([
    '',
    'postgresql://postgres@localhost:55432/nexora_test',
    'postgresql://postgres@127.0.0.1:5432/nexora_test',
    'postgresql://postgres@127.0.0.1:55432/nexora_test?host=example.invalid',
    'postgresql://postgres:password@127.0.0.1:55432/nexora_test',
    ' postgresql://postgres@127.0.0.1:55432/nexora_test',
  ])('rejects non-allowlisted URL %j before constructing a pool', async url => {
    vi.stubEnv('MOBILE_API_TEST_DATABASE_URL', url)
    vi.stubEnv('MOBILE_AUTH_TEST_DATABASE_URL', url)
    await expect(import('./mobile-api.integration.test')).rejects.toThrow('Only the explicitly isolated local test database is permitted.')
    await expect(import('../mobile-auth/mobile-auth.integration.test')).rejects.toThrow('Only the explicitly isolated local test database is permitted.')
  })
})
