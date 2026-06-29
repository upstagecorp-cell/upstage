import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://upstage.example.com'

const routes = [
  '',
  '/guide',
  '/onboarding',
  '/diagnosis',
  '/diagnosis/result',
  '/dashboard',
  '/action',
  '/history',
  '/goals',
  '/metrics',
  '/explore',
  '/pricing',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7,
  }))
}
