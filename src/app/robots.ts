import type { MetadataRoute } from 'next'
import { getConfiguredSiteUrl } from '@/lib/site-url'

const privateRoutes = [
  '/action',
  '/dashboard',
  '/diagnosis',
  '/goals',
  '/history',
  '/metrics',
  '/onboarding',
]

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getConfiguredSiteUrl()
  if (!siteUrl) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: privateRoutes,
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
