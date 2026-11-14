import { describe, expect, it } from 'vitest'
import { authDestinationFromSearch, authHref, safeAuthDestination } from './auth-destination'

describe('safe auth destinations', () => {
  it.each([
    '/workspace', '/workspace#media', '/workspace#billing',
    '/metrics', '/goals', '/workspace#goals', '/workspace#history',
    '/workspace#assessment', '/workspace#results', '/metrics#performance',
  ])('preserves %s', destination => {
    expect(safeAuthDestination(destination)).toBe(destination)
  })

  it('keeps valid assessment/action/goal identifiers and a safe section', () => {
    const destination = '/goals?assessment=assessment_01&action=action-2&goal=goal3#goals'
    expect(safeAuthDestination(destination)).toBe(destination)
    expect(safeAuthDestination('/workspace?assessment=a&action=b#media')).toBe('/workspace?assessment=a&action=b#media')
  })

  it('resolves the legacy history redirect without losing selection IDs', () => {
    expect(safeAuthDestination('/history')).toBe('/workspace#history')
    expect(safeAuthDestination('/history?assessment=saved_check')).toBe('/workspace?assessment=saved_check#history')
  })

  it('keeps the original billing alias', () => {
    expect(safeAuthDestination('billing')).toBe('/workspace#billing')
    expect(authDestinationFromSearch('?next=billing')).toBe('/workspace#billing')
  })

  it.each([
    null, undefined, '', 'https://evil.example/workspace', '//evil.example/workspace',
    'https://nexora.invalid/workspace', 'javascript:alert(1)', 'data:text/html,test',
    '/\\evil.example', '/workspace\\evil', '/workspace\n', '/workspace\t#billing',
    ' /workspace', '/workspace ', 'workspace', '/login', '/register', '/api/workspace',
    '/workspace/../goals', '/other/../workspace', '/%77orkspace', '%2Fworkspace',
    '/workspace/evil', '/workspace;evil', '///workspace',
  ])('falls back safely for %s', destination => {
    expect(safeAuthDestination(destination)).toBe('/workspace')
  })

  it('drops unknown queries, malformed IDs, duplicates, and unsafe hashes', () => {
    expect(safeAuthDestination('/goals?assessment=valid&action=bad%2Fid&goal=%20bad&next=https%3A%2F%2Fevil.example&token=secret#billing')).toBe('/goals?assessment=valid#billing')
    expect(safeAuthDestination('/metrics?assessment=a&assessment=b&goal=okay')).toBe('/metrics?goal=okay')
    expect(safeAuthDestination(`/workspace?action=${'a'.repeat(201)}`)).toBe('/workspace')
    expect(safeAuthDestination('/workspace#javascript:alert(1)')).toBe('/workspace')
    expect(safeAuthDestination('/workspace#%E0%A4%A')).toBe('/workspace')
    expect(safeAuthDestination('/workspace#%62illing')).toBe('/workspace#billing')
    expect(safeAuthDestination('/workspace?assessment=%252F%252Fevil.example')).toBe('/workspace')
  })

  it('keeps destinations through login/register switches without extra decoding', () => {
    const destination = '/goals?assessment=a_1&action=b-2&goal=c#goals'
    const registerLink = authHref('/register', destination)
    expect(registerLink).toMatch(/^\/register\?next=/)
    const registerSearch = new URL(registerLink, 'https://nexora.invalid').search
    expect(authDestinationFromSearch(registerSearch)).toBe(destination)
    const loginLink = authHref('/login', authDestinationFromSearch(registerSearch))
    expect(authDestinationFromSearch(new URL(loginLink, 'https://nexora.invalid').search)).toBe(destination)
  })

  it('keeps first-check handoff in the ordinary workspace and retains its marker', () => {
    expect(authDestinationFromSearch('?from=check')).toBe('/workspace')
    const href = authHref('/login', '/workspace', '?from=check&token=do-not-copy')
    const params = new URL(href, 'https://nexora.invalid').searchParams
    expect(params.get('from')).toBe('check')
    expect(params.get('next')).toBe('/workspace')
    expect(params.has('token')).toBe(false)
  })

  it('sanitizes invalid destinations on account switches too', () => {
    expect(authHref('/register', '//evil.example')).toBe('/register?next=%2Fworkspace')
    expect(authDestinationFromSearch('?next=%2F%2Fevil.example')).toBe('/workspace')
    expect(authDestinationFromSearch('?next=%252F%252Fevil.example')).toBe('/workspace')
  })
})
