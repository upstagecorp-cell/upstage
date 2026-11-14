const defaultDestination = '/workspace'
const destinationPaths = new Set(['/workspace', '/metrics', '/goals', '/history'])
const sectionHashes = new Set([
  'overview', 'assessment', 'goals', 'assets', 'media', 'evidence',
  'results', 'performance', 'profile', 'history', 'billing',
])
const selectionKeys = ['assessment', 'action', 'goal'] as const

/** Only return known internal routes, never an untrusted URL to router.replace. */
export function safeAuthDestination(next: string | null | undefined): string {
  if (next === 'billing') return '/workspace#billing'
  if (!next || next.length > 4096 || /[\s\\]/.test(next)) return defaultDestination
  // Check the literal path before URL parsing can normalize slashes or dot segments.
  const path = next.split(/[?#]/, 1)[0]
  if (!destinationPaths.has(path)) return defaultDestination

  const url = new URL(next, 'https://nexora.invalid')
  const params = new URLSearchParams()
  for (const key of selectionKeys) {
    const values = url.searchParams.getAll(key)
    if (values.length === 1 && /^[A-Za-z0-9_-]{1,200}$/.test(values[0])) params.set(key, values[0])
  }
  let section = ''
  try {
    const hash = decodeURIComponent(url.hash.slice(1))
    if (sectionHashes.has(hash)) section = hash
  } catch { /* Malformed or unknown hashes are not destinations. */ }

  // /history currently redirects without query parameters. Resolve its equivalent
  // workspace section here so saved assessment/action/goal selections survive.
  const destinationPath = path === '/history' ? '/workspace' : path
  if (path === '/history') section = 'history'
  const query = params.toString()
  return `${destinationPath}${query ? `?${query}` : ''}${section ? `#${section}` : ''}`
}

export function authDestinationFromSearch(search: string): string {
  return safeAuthDestination(new URLSearchParams(search).get('next'))
}

/** Keep a first-check handoff marker, but never propagate arbitrary auth params. */
export function authHref(path: '/login' | '/register', destination: string, search = ''): string {
  const params = new URLSearchParams({ next: safeAuthDestination(destination) })
  if (new URLSearchParams(search).get('from') === 'check') params.set('from', 'check')
  return `${path}?${params}`
}
