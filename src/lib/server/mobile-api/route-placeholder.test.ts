import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

// A fresh Node process prevents earlier test imports from hiding dependencies in
// a module cache. Resolution hooks reject any attempt to load pg or the internal
// experimental handler; socket connections are forbidden as an independent check.
const checkRoutes = String.raw`
  import { registerHooks } from 'node:module'
  import { Socket } from 'node:net'
  import { pathToFileURL } from 'node:url'
  import { resolve } from 'node:path'
  import assert from 'node:assert/strict'

  registerHooks({ resolve(specifier, context, nextResolve) {
    if (specifier === 'pg' || specifier.startsWith('pg/') || specifier === 'pg-native' ||
        specifier.includes('mobile-api') || specifier.includes('mobile-auth')) {
      throw new Error('Forbidden database or internal handler import: ' + specifier)
    }
    return nextResolve(specifier, context)
  } })
  Socket.prototype.connect = function () { throw new Error('Unexpected socket connection') }
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
  const expected = { error: { code: 'SERVER_ERROR', message: 'Authentication is temporarily unavailable.' } }
  const badRequest = new Proxy({}, { get() { throw new Error('Request was inspected') } })
  for (const name of ['login', 'refresh', 'logout', 'logout-all']) {
    const filename = resolve('src/app/api/mobile/v1/auth', name, 'route.ts')
    const route = await import(pathToFileURL(filename).href)
    for (const method of methods) {
      const response = await route[method](badRequest)
      assert.equal(response.status, 503, name + ' ' + method)
      assert.equal(response.headers.get('cache-control'), 'no-store')
      assert.equal(response.headers.get('pragma'), 'no-cache')
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
      assert.deepEqual(await response.json(), expected)
    }
  }
`

describe('disabled mobile auth route placeholders', () => {
  for (const nodeEnv of [undefined, '', 'development', 'test', 'production', 'staging']) {
    for (const flag of [undefined, '1']) {
      it(`returns the fixed 503 for every supported method without importing PG (NODE_ENV=${String(nodeEnv)}, flag=${String(flag)})`, () => {
        const env: Record<string, string | undefined> = { ...process.env, NODE_NO_WARNINGS: '1', NODE_PG_FORCE_NATIVE: '1',
          NEXORA_MOBILE_DEV_DATABASE_URL: 'postgresql://postgres@127.0.0.1:55432/nexora_test' }
        if (nodeEnv === undefined) delete env.NODE_ENV
        else env.NODE_ENV = nodeEnv
        if (flag === undefined) delete env.NEXORA_MOBILE_DEV_API
        else env.NEXORA_MOBILE_DEV_API = flag
        const child = spawnSync(process.execPath, ['--input-type=module', '--eval', checkRoutes], {
          cwd: process.cwd(), env: env as NodeJS.ProcessEnv, encoding: 'utf8', timeout: 10000,
        })
        expect(child.error?.message).toBeUndefined()
        expect(child.status, child.stderr).toBe(0)
      })
    }
  }
})
