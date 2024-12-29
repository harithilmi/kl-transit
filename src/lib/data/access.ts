import routes from '@/data/v2/routes.json'
import stops from '@/data/clean/stops.json'
import services from '@/data/clean/services.json'
import shapes from '@/data/clean/shapes.json'
import type { Route, Stop, Service, Shape } from '@/types/routes'

export async function getRoutes() {
  return routes as Route[]
}

export async function getStops() {
  return stops as Stop[]
}

export async function getServices() {
  return services as Service[]
}

export async function getShapes() {
  return shapes as Shape[]
}
