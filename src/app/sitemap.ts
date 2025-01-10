import type { MetadataRoute } from 'next'
import { db } from '@/server/db'
import { kl_transit_routes } from '@/server/db/schema'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Base routes that are available in both languages
  const baseRoutes = ['', '/routes']

  // Get all active routes with a simpler query
  const activeRoutes = await db
    .select({
      route_id: kl_transit_routes.route_id,
    })
    .from(kl_transit_routes)

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
    activeRoutes.map((route) => ({
      url: `${baseUrl}/${locale}/routes/${route.route_id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  )

  return [...staticPages, ...routePages]
}
