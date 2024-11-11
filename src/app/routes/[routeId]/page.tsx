import { promises as fs } from 'fs'
import path from 'path'
import { Card } from '~/components/ui/card'
import { notFound } from 'next/navigation'
import { parse } from 'csv-parse/sync'
import { RouteStopList } from '~/app/components/route-stop-list'
import type { RouteStop, RouteStopWithData, Stop } from '~/app/types/routes'

type DirectionMap = Record<string, RouteStopWithData[]>

// Helper function to read and parse CSV
async function readCsv<T extends object>(filePath: string): Promise<T[]> {
  const fileContent = await fs.readFile(filePath, 'utf-8')
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  }) as T[]
  return records
}

async function getRouteData(routeId: string): Promise<DirectionMap> {
  // Read CSV files
  const dataDir = path.join(process.cwd(), 'src/data/processed')
  const [routeStops, stops] = await Promise.all([
    readCsv<RouteStop>(path.join(dataDir, 'services.csv')),
    readCsv<Stop>(path.join(dataDir, 'stops.csv')),
  ])

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
  params: Promise<{ routeId: string }>
}) {
  // Await the params object to access routeId
  const { routeId } = await params
  if (!routeId) {
    notFound()
  }

  const stopsByDirection = await getRouteData(routeId)
  const directions = Object.keys(stopsByDirection)

  if (directions.length === 0) {
    notFound()
  }

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

        {/* Main content */}
        <div className="flex w-full max-w-4xl flex-col gap-6 sm:gap-8">
          <Card className="w-full overflow-hidden text-white">
            <RouteStopList stopsByDirection={stopsByDirection} />
          </Card>

          {/* Map placeholder */}
          <Card className="aspect-video w-full text-white">
            <div className="flex h-full items-center justify-center text-white/50">
              Map coming soon
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
