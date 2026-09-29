const PLACEHOLDER_HOSTS = new Set(['your-production-domain.com', 'nexsora.example.com'])

export function getConfiguredSiteUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!configured) return null

  try {
    const url = new URL(configured)
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (PLACEHOLDER_HOSTS.has(url.hostname)) return null
    if (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) return null
    return url.origin
  } catch {
    return null
  }
}
