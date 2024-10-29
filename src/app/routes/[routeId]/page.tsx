import { db } from '~/server/db'
import { Card } from '~/components/ui/card'
import { notFound } from 'next/navigation'

export default async function RoutePage({
  params,
}: {
  params: { routeId: string }
}) {
  const route = await db.query.routes.findFirst({
    where: (routes, { eq }) => eq(routes.routeId, params.routeId),
  })

  if (!route) {
    notFound()
  }

  const routeStops = await db.query.routeStops.findMany({
    where: (routeStops, { eq }) => eq(routeStops.routeId, route.routeId),
    with: {
      stop: true,
    },
    orderBy: (routeStops, { asc }) => [asc(routeStops.sequence)],
  })

  // Filter out any route stops where the stop data is missing
  const validRouteStops = routeStops.filter(
    (routeStop) => routeStop.stop !== null,
  )

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <div className="container flex max-w-6xl flex-col items-center gap-12">
        {/* Route Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-bold"
            style={{
              backgroundColor: `#${route.routeColor}`,
              color: `#${route.routeTextColor}`,
            }}
          >
            {route.routeShortName}
          </div>
          <h1 className="text-3xl font-bold">{route.routeLongName}</h1>
        </div>

        {/* Stops List */}
        <Card className="w-full max-w-2xl">
          <div className="flex flex-col divide-y divide-white/10">
            {validRouteStops.map((routeStop, index) => (
              <div key={routeStop.id} className="flex items-center gap-4 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 font-mono">
                  {index + 1}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {routeStop.stop.stopName}
                  </span>
                  {routeStop.stop.stopDesc && (
                    <span className="text-sm text-white/70">
                      {routeStop.stop.stopDesc}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {validRouteStops.length === 0 && (
              <div className="p-4 text-center text-white/70">
                No stops found for this route
              </div>
            )}
          </div>
        </Card>

        {/* Map placeholder */}
        <Card className="aspect-video w-full max-w-2xl">
          <div className="flex h-full items-center justify-center text-white/50">
            Map coming soon
          </div>
        </Card>
      </div>
    </main>
  )
}
