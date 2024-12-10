import type { RouteDetails, RouteShape } from '@/types/routes'

export async function fetchRouteData(
  routeId: string,
): Promise<RouteDetails | null> {
  try {
    const routes = await import('@/data/from_db/kl-transit_route.json')
    const stops = await import('@/data/from_db/kl-transit_stop.json')
    const services = await import('@/data/from_db/kl-transit_service.json')
    const shapesData = await import(
      '@/data/from_db/kl-transit_route_shape.json'
    )

    const route = routes.default.find((r) => r.route_number === routeId)
    if (!route) return null

    // Find all services for this route and attach stop data
    const routeServices = services.default
      .filter((service) => service.route_number === routeId)
      .map((service) => {
        const stop = stops.default.find((s) => s.stop_id === service.stop_id)
        if (!stop) {
          throw new Error(`Stop not found for service: ${service.stop_id}`)
        }
        return {
          ...service,
          stop,
        }
      })

    // Get shape data for both directions
    const shapes = shapesData.default as RouteShape[]
    const routeShapes = shapes.filter((shape) => shape.route_number === routeId)
    const direction1Shape =
      routeShapes.find((shape) => shape.direction === 1)?.coordinates ?? []
    const direction2Shape =
      routeShapes.find((shape) => shape.direction === 2)?.coordinates ?? []

    return {
      route_id: route.id,
      route_number: route.route_number,
      route_name: route.route_name,
      route_type: route.route_type,
      services: routeServices,
      shape: {
        direction1: {
          route_number: routeId,
          direction: 1,
          coordinates: direction1Shape,
        },
        direction2: {
          route_number: routeId,
          direction: 2,
          coordinates: direction2Shape,
        },
      },
    }
  } catch (error) {
    console.error('Error loading route:', error)
    return null
  }
}
