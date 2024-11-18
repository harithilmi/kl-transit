import { Card } from '~/components/ui/card'
import { notFound } from 'next/navigation'
import { RouteStopList } from '~/app/components/route-stop-list'
import { db } from '~/server/db'
import { eq } from 'drizzle-orm'
import { routes, routeShapes } from '~/server/db/schema'
import type { RouteStopWithData } from '~/app/types/routes'
import { RouteMap } from '~/app/components/route-map'

// Add type for the route shape
type RouteShape = {
  routeNumber: string
  direction: number
  coordinates: [number, number][]
}

export default async function RoutePage({
  params,
}: {
  params: { routeId: string }
}) {
  const { routeId } = await Promise.resolve(params)
  if (!routeId) {
    notFound()
  }

  // Get route info and services in a single query
  const routeWithServices = await db.query.routes.findFirst({
    where: eq(routes.routeNumber, routeId),
    with: {
      services: {
        with: {
          stop: true,
        },
        orderBy: (services, { asc }) => [asc(services.sequence)],
      },
    },
  })

  if (!routeWithServices || routeWithServices.services.length === 0) {
    notFound()
  }

  // Get all connecting services in a single query instead of multiple queries
  const uniqueStopIds = [
    ...new Set(routeWithServices.services.map((s) => s.stopId)),
  ]
  const allStopServices = await db.query.services.findMany({
    where: (services, { inArray }) => inArray(services.stopId, uniqueStopIds),
    with: {
      route: true,
    },
  })

  // Create lookup map for services by stopId
  const stopServicesMap = allStopServices.reduce((acc, service) => {
    const services = acc.get(service.stopId) ?? []
    services.push(service)
    acc.set(service.stopId, services)
    return acc
  }, new Map<string, typeof allStopServices>())

  // Transform to match RouteStopWithData type
  const transformedServices: RouteStopWithData[] = routeWithServices.services.map(
    (service) => ({
      route_number: service.routeNumber,
      stop_id: service.stopId,
      stop_code: service.stop.stopCode ?? '',
      direction: service.direction,
      zone: service.zone,
      sequence: service.sequence,
      stop: {
        stop_id: service.stop.stopId,
        stop_code: service.stop.stopCode ?? '',
        stop_name: service.stop.stopName,
        street_name: service.stop.streetName ?? '',
        latitude: Number(service.stop.latitude),
        longitude: Number(service.stop.longitude),
        connecting_routes: (stopServicesMap.get(service.stopId) ?? []).map(
          (s) => ({
            route_number: s.routeNumber,
            route_name: s.route.routeName,
            service_id: s.id,
          }),
        ),
      },
    }),
  )

  // Get route shapes for both directions - Fix the query to use the table from schema
  const shapes = (await db.query.routeShapes.findMany({
    where: eq(routeShapes.routeNumber, routeId),
  })) as RouteShape[]

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] px-2 py-8 text-white sm:px-4 sm:py-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 sm:gap-12">
        {/* Back button */}
        <div className="w-full max-w-4xl px-2">
          <a
            href="/routes"
            className="inline-flex items-center text-sm text-white/70 hover:text-white"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Routes
          </a>
        </div>

        {/* Route header */}
        <div className="flex w-full max-w-xl flex-col gap-6 sm:gap-8">
          <Card className="w-full p-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl text-center font-bold">
                Route {routeId}
              </h1>
              <p className="text-lg text-center text-white/80">
                {routeWithServices.routeName}
              </p>
            </div>
          </Card>
        </div>

        {/* Map */}
        <Card className="w-full max-w-xl h-96 overflow-hidden">
          <RouteMap services={transformedServices} routeShapes={shapes} />
        </Card>

        {/* Main content */}
        <div className="flex w-full max-w-xl flex-col gap-6 sm:gap-8">
          <Card className="w-full overflow-hidden text-white">
            <RouteStopList services={transformedServices} />
          </Card>
        </div>
      </div>
    </main>
  )
}
