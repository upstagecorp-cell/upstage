import type { MetadataRoute } from 'next'
import { getConfiguredSiteUrl } from '@/lib/site-url'

const routes = [
  '',
  '/guide',
  '/explore',
  '/pricing',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getConfiguredSiteUrl()
  if (!siteUrl) return []

  const now = new Date()

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7,
  }))
}
