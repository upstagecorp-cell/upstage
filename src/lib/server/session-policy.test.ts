import { describe, expect, it } from 'vitest'
import { sessionCookiePolicy } from './session-policy'

describe('public session cookie policy', () => {
  it('retains strict cookies for plain HTTP local development', () => {
    expect(sessionCookiePolicy('http://localhost:3000/login', {})).toBe('SameSite=Strict')
  })
  it('uses secure cross-site cookies for public HTTPS, including proxied HTTP', () => {
    expect(sessionCookiePolicy('http://localhost:3000/login', { appOrigin: 'https://nexora.example' })).toBe('SameSite=None; Secure')
    expect(sessionCookiePolicy('https://nexora.example/login', {})).toBe('SameSite=None; Secure')
  })
  it('recognizes an explicitly managed HTTPS preview without trusting request headers', () => {
    expect(sessionCookiePolicy('http://localhost:3000/login', { managedProject: 'project' })).toBe('SameSite=None; Secure')
  })
  it('does not treat malformed configured origins as public HTTPS', () => {
    expect(sessionCookiePolicy('http://localhost:3000/login', { appOrigin: 'not-a-url' })).toBe('SameSite=Strict')
  })
})
