import routes from '@/data/v2/routes.json'
import stops from '@/data/clean/stops.json'
import type { Route, Stop } from '@/types/routes'

export async function getRoutes() {
  return routes as Route[]
}

export async function getStops() {
  return stops as Stop[]
}
