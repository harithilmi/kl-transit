import { promises as fs } from 'fs'
import path from 'path'
import { Card } from '~/components/ui/card'
import { notFound } from 'next/navigation'
import { parse } from 'csv-parse/sync'
import { RouteStopList } from '~/app/components/route-stop-list'
import type { RouteStop, RouteStopWithData, Stop } from '~/app/types/routes'

type DirectionMap = Record<string, RouteStopWithData[]>

async function validateRouteParams(params: { routeId: string }) {
  const routeId = params.routeId
  if (!routeId) {
    notFound()
  }
  return routeId
}

async function getRouteData(routeId: string): Promise<DirectionMap> {
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

  // Group stops by direction with proper typing
  const stopsByDirection = validRouteStops.reduce<DirectionMap>((acc, stop) => {
    const direction = stop.direction
    if (!acc[direction]) {
      acc[direction] = []
    }
    acc[direction].push(stop)
    return acc
  }, {} as DirectionMap)

  return stopsByDirection
}

export default async function RoutePage({
  params,
}: {
  params: { routeId: string }
}) {
  const routeId = await validateRouteParams(params)
  const stopsByDirection = await getRouteData(routeId)
  const directions = Object.keys(stopsByDirection)

  if (directions.length === 0) {
    notFound()
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <div className="container flex max-w-4xl min-w-96 flex-col items-center gap-12">
        <Card className="w-full">
          <RouteStopList stopsByDirection={stopsByDirection} />
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
