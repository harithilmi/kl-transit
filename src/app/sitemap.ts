import type { MetadataRoute } from 'next'
import routes from '@/data/from_db/kl-transit_route.json'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Base routes that are available in both languages
  const baseRoutes = ['', '/routes']

  // Generate route entries for each language
  const staticPages = ['en', 'ms'].flatMap((locale) =>
    baseRoutes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.8,
    })),
  )

  // Generate dynamic route entries for bus routes
  const routePages = ['en', 'ms'].flatMap((locale) =>
    routes.map((route) => ({
      url: `${baseUrl}/${locale}/routes/${route.route_number}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  )

  return [...staticPages, ...routePages]
}
