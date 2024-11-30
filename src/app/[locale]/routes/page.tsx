import { Card, CardContent } from '@/app/components/ui/card'
import { SearchForm } from '@/app/[locale]/routes/search-form'
import { Link } from '@/i8n/routing'

import type { Route } from '@/types/routes'
import { getLocale, getTranslations } from 'next-intl/server'

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_APP_URL

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const locale = await getLocale()
  const t = await getTranslations()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_APP_URL is not defined')

  const { q } = searchParams
  const searchQuery = q ?? ''

  const res = await fetch(
    `${baseUrl}/${locale}/api/routes${
      searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''
    }`,
    {
      next: { revalidate: 3600 }, // Cache for 1 hour
    },
  )
  const routes = (await res.json()) as Route[]

  return (
    <main className="min-h-screen bg-background px-2 py-8 text-foreground sm:px-4 sm:py-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 sm:gap-8">
        {/* Header Section */}
        <div className="flex w-full max-w-xl flex-col gap-4 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">
            {t('RoutesPage.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('RoutesPage.subtitle')}
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="w-full max-w-xl p-4">
          <SearchForm initialSearch={searchQuery} />
        </Card>

        {/* Routes Grid */}
        <div className="grid w-full max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <Link
              href={`/routes/${route.route_number}`}
              key={route.route_id || `route-${route.route_number}`}
            >
              <Card className="h-24 transition-colors hover:bg-accent hover:text-accent-foreground active:ring-2 active:ring-ring active:ring-offset-2 active:ring-offset-background">
                <CardContent className="flex h-full items-center p-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">
                        {route.route_number}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                        {t(`RoutesPage.routeTypes.${route.route_type}`)}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground text-pretty">
                      {route.route_name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
