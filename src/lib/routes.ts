import type { Route } from '@/types/routes'
import { getRoutes } from '@/lib/data/access'

export async function getRouteData(routeId: number): Promise<Route | null> {
  try {
    // Get data using access functions
    const routes = await getRoutes()

    // Get basic route info
    const route = routes.find((r) => r.routeId === routeId)
    if (!route) return null

    return route
  } catch (error) {
    console.error('Error getting route data:', error)
    return null
  }
}
