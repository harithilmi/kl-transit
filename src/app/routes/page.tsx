import { Card } from '~/components/ui/card'
import { SearchForm } from './search-form'
import Link from 'next/link'
import type { Route } from '~/app/types/routes'

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_APP_URL

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  if (!baseUrl) throw new Error('NEXT_PUBLIC_APP_URL is not defined')
  const searchQuery = searchParams.q ?? ''
  const res = await fetch(
    `${baseUrl}/api/routes${
      searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''
    }`,
    {
      next: { revalidate: 3600 }, // Cache for 1 hour
    },
  )
  const routes = (await res.json()) as Route[]

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
            <SearchForm initialSearch={searchQuery} />
          </div>
        </Card>

        {/* Routes Grid */}
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <Link
              className="transition-transform hover:scale-105"
              href={`/routes/${route.route_number}`}
              key={route.route_id || `route-${route.route_number}`}
            >
              <Card className="flex flex-col p-4">
                <div className="flex flex-col">
                  <span className="font-semibold">{route.route_number}</span>
                  <span className="text-sm text-white/70">
                    {route.route_name}
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
