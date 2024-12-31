import routes from '@/data/v2/routes.json'
import stops from '@/data/clean/stops.json'
import type { Route, Stop } from '@/types/routes'

export async function getRoutes(routeId: string | null = null) {
  if (!routeId) return routes as Route[]
  return routes.find((r) => r.routeId === Number(routeId)) as Route
}

export async function getStops() {
  return stops as Stop[]
}
