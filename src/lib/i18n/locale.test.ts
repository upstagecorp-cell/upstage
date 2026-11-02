import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, translate } from './locale'

describe('interface locale', () => {
  it('uses US English independently of previously recorded locales', () => {
    expect(DEFAULT_LOCALE).toBe('en-US')
    expect(translate('ko-KR', 'workspace')).toBe('Workspace')
  })

  it('provides natural text instead of exposing missing translation keys', () => {
    expect(translate('en-US', 'workspace')).toBe('Workspace')
    expect(translate('ko-KR', 'workspace')).toBe('Workspace')
    expect(translate('en-US', 'not-a-real-key')).not.toBe('not-a-real-key')
  })
})
