import { promises as fs } from 'fs'
import path from 'path'
import { Card } from '~/components/ui/card'
import { notFound } from 'next/navigation'
import { parse } from 'csv-parse/sync'

// Types for our data
type RouteStop = {
  route_number: string
  stop_id: string
  stop_code: string
  direction: string
  zone: string
  sequence: string
}

type Stop = {
  stop_id: string
  stop_code: string
  stop_name: string
  street_name: string
  latitude: string
  longitude: string
  stop_name_old: string
  street_name_old: string
}

async function getRouteData(routeId: string) {
  // Read CSV files
  const servicesPath = path.join(
    process.cwd(),
    'src/data/processed/services.csv',
  )
  const stopsPath = path.join(process.cwd(), 'src/data/processed/stops.csv')

  const [servicesFile, stopsFile] = await Promise.all([
    fs.readFile(servicesPath, 'utf-8'),
    fs.readFile(stopsPath, 'utf-8'),
  ])

  // Parse CSV data
  const routeStops = parse(servicesFile, {
    columns: true,
    skip_empty_lines: true,
  }) as RouteStop[]

  const stops = parse(stopsFile, {
    columns: true,
    skip_empty_lines: true,
  }) as Stop[]

  // Filter route stops for this route
  const routeStopsFiltered = routeStops.filter(
    (rs) => rs.route_number === routeId,
  )

  // Sort by sequence
  routeStopsFiltered.sort((a, b) => parseInt(a.sequence) - parseInt(b.sequence))

  // Map stops data to route stops
  const stopsMap = new Map(stops.map((stop) => [stop.stop_id, stop]))

  const validRouteStops = routeStopsFiltered
    .map((rs) => ({
      ...rs,
      stop: stopsMap.get(rs.stop_id),
    }))
    .filter((rs) => rs.stop !== undefined)

  return validRouteStops
}

export default async function RoutePage({
  params,
}: {
  params: { routeId: string }
}) {
  const routeStops = await getRouteData(params.routeId)

  if (routeStops.length === 0) {
    notFound()
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <div className="container flex max-w-6xl flex-col items-center gap-12">
        {/* Route Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-bold bg-white text-black">
            {params.routeId}
          </div>
        </div>

        {/* Stops List */}
        <Card className="w-full max-w-2xl">
          <div className="flex flex-col divide-y divide-white/10">
            {routeStops.map((routeStop, index) => (
              <div
                key={`${routeStop.stop_id}-${index}`}
                className="flex items-center gap-4 p-4"
              >
                <div className="flex p-2 items-center justify-center rounded-md bg-white/10 font-mono">
                  {routeStop.stop?.stop_code}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {routeStop.stop?.stop_name}
                  </span>
                  {routeStop.stop?.street_name && (
                    <span className="text-sm text-white/70">
                      {routeStop.stop.street_name}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {routeStops.length === 0 && (
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
