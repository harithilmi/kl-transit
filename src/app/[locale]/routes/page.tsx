import { Card, CardContent } from '@/components/ui/card'
import { SearchButton } from '@/components/search/search-button'
import { Link } from '@/i8n/routing'
import { getTranslations } from 'next-intl/server'
import routes from '@/data/v2/routes.json'
import type { Route } from '@/types/routes'

export default async function RoutesPage() {
  const t = await getTranslations()

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
          <SearchButton />
        </Card>

        {/* Routes Grid */}
        <div className="grid w-full max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(routes as Route[]).map((route) => (
            <Link
              href={`/routes/${route.routeShortName}`}
              key={route.routeShortName}
            >
              <Card className="h-24 transition-colors hover:bg-accent hover:text-accent-foreground active:ring-2 active:ring-ring active:ring-offset-2 active:ring-offset-background">
                <CardContent className="flex h-full items-center p-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">
                        {route.routeShortName}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                        {t(`RoutesPage.routeTypes.${route.networkId}`)}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground text-pretty">
                      {route.routeLongName}
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
