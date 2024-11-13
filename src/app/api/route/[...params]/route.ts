import { type NextRequest } from 'next/server'
import type { Stop } from '~/app/types/routes'
import bundledData from '~/data/bundled-data.json'

// Add type for the response data structure
type StopsByDirection = Record<string, {
  sequence: number
  stop_id: string
  stop_name: string
  street_name: string
  latitude: number
  longitude: number
  direction: string
  zone: string
}[]>

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } },
) {
  try {
    const [routeNumber] = params.params

    // If no route number provided, return all routes
    if (!routeNumber) {
      const uniqueRoutes = [...new Set(bundledData.services.map((s) => s.route_number))]
      return Response.json({
        routes: uniqueRoutes,
        stops: bundledData.stops,
        services: bundledData.services.map(service => ({
          ...service,
          sequence: Number(service.sequence)
        }))
      })
    }
    // Using the bundled data for specific route
    const routeServices = bundledData.services
      .map(service => ({
        ...service,
        sequence: Number(service.sequence)
      }))
      .filter((service) => service.route_number === routeNumber)
      .sort((a, b) => a.sequence - b.sequence)

    // Group by direction
    const stopsByDirection = routeServices.reduce<StopsByDirection>((acc, service) => {
      const direction = service.direction
      if (!acc[direction]) {
        acc[direction] = []
      }

      const stop = (bundledData.stops as Stop[]).find(
        (stop) => stop.stop_id === service.stop_id,
      )

      if (stop) {
        acc[direction].push({
          sequence: service.sequence,
          stop_id: service.stop_id,
          stop_name: stop.stop_name,
          street_name: stop.street_name,
          latitude: parseFloat(stop.latitude),
          longitude: parseFloat(stop.longitude),
          direction: service.direction,
          zone: service.zone,
        })
      }

      return acc
    }, {})

    return Response.json({
      route_number: routeNumber,
      directions: stopsByDirection,
    })
  } catch (error: unknown) {
    console.error('Error loading route data:', error)
    return Response.json(
      { error: 'Failed to load route data' },
      { status: 500 },
    )
  }
}