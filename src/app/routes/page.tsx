import { db } from '~/server/db'
import { Card } from '~/components/ui/card'
import { SearchForm } from './search-form'

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const search = searchParams.q?.toLowerCase() ?? ''

  const routes = await db.query.routes.findMany({
    orderBy: (routes, { asc }) => [asc(routes.routeShortName)],
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
            <Card key={route.id} className="flex flex-col p-4">
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
                  <span className="font-semibold">{route.routeShortName}</span>
                  <span className="text-sm text-white/70">
                    {route.routeLongName}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
