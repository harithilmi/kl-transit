import { promises as fs } from 'fs'
import path from 'path'
import { Card } from '~/components/ui/card'
import { notFound } from 'next/navigation'
import { parse } from 'csv-parse/sync'
import { RouteStopList } from '~/app/components/route-stop-list'

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

type RouteStopWithData = RouteStop & {
  stop: Stop | undefined
}

type DirectionMap = Record<string, RouteStopWithData[]>

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

// Helper function to group stops by zone
function groupByZone(stops: RouteStopWithData[]) {
  return stops.reduce<Record<string, RouteStopWithData[]>>((acc, stop) => {
    const zone = stop.zone
    if (!acc[zone]) {
      acc[zone] = []
    }
    acc[zone].push(stop)
    return acc
  }, {})
}

export default async function RoutePage({
  params,
}: {
  params: { routeId: string }
}) {
  const stopsByDirection = await getRouteData(params.routeId)
  const directions = Object.keys(stopsByDirection)

  if (directions.length === 0) {
    notFound()
  }

  const firstDirection = directions[0]
  const secondDirection = directions[1]

  // Get stops for each direction with proper type checking
  const firstDirectionStops: RouteStopWithData[] = firstDirection
    ? stopsByDirection[firstDirection] ?? []
    : []
  const secondDirectionStops: RouteStopWithData[] = secondDirection
    ? stopsByDirection[secondDirection] ?? []
    : []

  // Safely access start and end stops with explicit type annotations
  const startStop = firstDirectionStops[0]?.stop?.stop_name ?? ''
  const endStop =
    firstDirectionStops.length > 0
      ? firstDirectionStops[firstDirectionStops.length - 1]?.stop?.stop_name ??
        ''
      : ''

  // Group stops by zone with proper type checking
  const firstDirectionByZone = groupByZone(firstDirectionStops)
  const secondDirectionByZone = groupByZone(
    secondDirectionStops.length > 0 ? [...secondDirectionStops].reverse() : [],
  )

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <div className="container flex max-w-6xl flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-4 bg-white/5 p-4 rounded-lg">
          <h1 className="text-4xl font-bold">Route {params.routeId}</h1>
          <span className="text-xl text-white/70">
            {startStop} ↔ {endStop}
          </span>
        </div>
        <Card className="w-full">
          <RouteStopList
            firstDirectionByZone={firstDirectionByZone}
            secondDirectionByZone={secondDirectionByZone}
          />
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
