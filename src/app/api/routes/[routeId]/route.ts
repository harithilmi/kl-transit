import { NextResponse } from 'next/server'
import type { RouteDetails, RouteShape } from '~/app/types/routes'
import routes from '~/data/from_db/kl-transit_route.json'
import stops from '~/data/from_db/kl-transit_stop.json'
import services from '~/data/from_db/kl-transit_service.json'
import shapesData from '~/data/from_db/kl-transit_route_shape.json'

export async function GET(
  request: Request,
  { params }: { params?: { routeId?: string } },
) {
  try {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const { routeId } = (await params) ?? {}

    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 },
      )
    }

    const route = routes.find((r) => r.route_number === routeId)

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    // Find all services for this route and attach stop data
    const routeServices = services
      .filter((service) => service.route_number === routeId)
      .map((service) => {
        const stop = stops.find((s) => s.stop_id === service.stop_id)
        if (!stop) {
          throw new Error(`Stop not found for service: ${service.stop_id}`)
        }
        return {
          ...service,
          stop,
        }
      })

    // Get shape data for both directions
    const shapes = shapesData as RouteShape[]
    const routeShapes = shapes.filter((shape) => shape.route_number === routeId)
    const direction1Shape =
      routeShapes.find((shape) => shape.direction === 1)?.coordinates ?? []
    const direction2Shape =
      routeShapes.find((shape) => shape.direction === 2)?.coordinates ?? []

    const routeDetails: RouteDetails = {
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

    return new NextResponse(JSON.stringify(routeDetails), {
      headers: {
        'Cache-Control':
          'public, s-maxage=86400, stale-while-revalidate=604800',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error in route detail API:', error)
    return NextResponse.json(
      { error: 'Failed to load route details' },
      { status: 500 },
    )
  }
}
