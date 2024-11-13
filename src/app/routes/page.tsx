import { Card } from '~/components/ui/card'
import { SearchForm } from './search-form'
import Link from 'next/link'
import bundledData from '~/data/bundled-data.json'
import servicesData from '~/data/services.json'
import type { Route } from '../types/routes'

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const search = searchParams.q?.toLowerCase() ?? ''

  // Get unique routes
  const routeNumbers = [
    ...new Set(bundledData.services.map((s) => s.route_number)),
  ]

  // Create route objects with route names from services.json
  const routes: Route[] = routeNumbers.map((routeNumber) => {
    return {
      routeId: routeNumber,
      routeShortName: routeNumber,
      routeLongName: servicesData[routeNumber]?.route_name ?? routeNumber,
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
                <div className="flex flex-col">
                  <span className="font-semibold">{route.routeShortName}</span>
                  <span className="text-sm text-white/70">
                    {route.routeLongName}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
