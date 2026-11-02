export type Locale = 'en-US' | 'ko-KR'

export const DEFAULT_LOCALE: Locale = 'en-US'

const en = {
  workspace: 'Workspace',
  guide: 'How it works',
  pricing: 'Pricing',
  navigation: 'Main navigation',
  theme: 'Switch color theme',
  loading: 'Loading your workspace…',
  continue: 'Continue to workspace',
  unavailable: 'This information is not available yet.',
} as const

export function translate(_locale: Locale, key: string): string {
  // The current release is English-only, independently of previously saved locales.
  return (en as Record<string, string>)[key] ?? en.unavailable
}
