import { Card } from '~/components/ui/card'
import { SearchForm } from './search-form'
import Link from 'next/link'
import path from 'path'
import fs from 'fs'
import { parse } from 'csv-parse/sync'

// Types for our data
interface Stop {
  stop_id: string
  stop_name: string
  latitude: number
  longitude: number
}

interface Service {
  route_number: string
  stop_id: string
  direction: string
  zone: string
  sequence: number
}

interface Route {
  routeId: string
  routeShortName: string
  routeLongName: string
  routeColor: string
  routeTextColor: string
}

// Function to get unique route numbers from services
function getUniqueRoutes(services: Service[]): string[] {
  return [...new Set(services.map(service => service.route_number))]
}

// Helper function to read and parse CSV
function readCsv<T extends object>(filePath: string): T[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  }) as T[]
  return records
}

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const search = searchParams.q?.toLowerCase() ?? ''

  // Read CSV files
  const dataDir = path.join(process.cwd(), 'src/data/processed')
  const services: Service[] = readCsv<Service>(path.join(dataDir, 'services.csv'))
  const stops: Stop[] = readCsv<Stop>(path.join(dataDir, 'stops.csv'))

  // Get unique routes
  const routeNumbers = getUniqueRoutes(services)

  // Create route objects with first and last stops
  const routes: Route[] = routeNumbers.map(routeNumber => {
    const routeServices = services.filter(s => s.route_number === routeNumber)
    
    // Get direction 1 services
    const direction1 = routeServices
      .filter(s => s.direction === '1')
      .sort((a, b) => a.sequence - b.sequence)

    // Get direction 2 services
    const direction2 = routeServices
      .filter(s => s.direction === '2')
      .sort((a, b) => a.sequence - b.sequence)

    // Get first and last stops for direction 1
    const firstStop1 = direction1.length > 0 && direction1[0]
      ? stops.find(s => s.stop_id === direction1[0]?.stop_id) ?? null
      : null
    const lastStop1 = direction1.length > 0 && direction1[direction1.length - 1]
      ? stops.find(s => s.stop_id === direction1[direction1.length - 1]?.stop_id) ?? null
      : null

    // Get first and last stops for direction 2
    const firstStop2 = direction2.length > 0 && direction2[0]
      ? stops.find(s => s.stop_id === direction2[0]?.stop_id) ?? null
      : null
    const lastStop2 = direction2.length > 0 && direction2[direction2.length - 1]
      ? stops.find(s => s.stop_id === direction2[direction2.length - 1]?.stop_id) ?? null
      : null

    return {
      routeId: routeNumber,
      routeShortName: routeNumber,
      routeLongName: direction1.length > 0
        ? `${firstStop1?.stop_name ?? ''} ↔ ${lastStop1?.stop_name ?? ''}`
        : `${firstStop2?.stop_name ?? ''} ↔ ${lastStop2?.stop_name ?? ''}`,
      routeColor: '1e40af', // Default blue color
      routeTextColor: 'ffffff', // White text
    }
  })

  const filteredRoutes = routes.filter(
    (route) =>
      route.routeShortName.toLowerCase().includes(search) ||
      route.routeLongName.toLowerCase().includes(search),
  )

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <div className="container flex max-w-6xl flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight">Bus Routes</h1>
          <p className="text-lg text-white/80">
            Find detailed information about KL bus routes
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="w-full max-w-2xl">
          <div className="flex flex-col gap-4 p-4">
            <SearchForm initialSearch={search} />
          </div>
        </Card>

        {/* Routes Grid */}
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoutes.map((route) => (
            <Link
              className="transition-transform hover:scale-105"
              href={`/routes/${route.routeId}`}
              key={route.routeId}
            >
              <Card className="flex flex-col p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg font-bold"
                    style={{
                      backgroundColor: `#${route.routeColor}`,
                      color: `#${route.routeTextColor}`,
                    }}
                  >
                    {route.routeShortName}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {route.routeShortName}
                    </span>
                    <span className="text-sm text-white/70">
                      {route.routeLongName}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
