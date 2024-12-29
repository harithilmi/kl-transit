import { Card } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { type Metadata } from 'next'
import { MapsContainer } from './maps-container'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i8n/routing'
import type { Route } from '@/types/routes'
import { RouteStopList } from '@/components/routes/route-stop-list'
import routes from '@/data/v2/routes.json'
import { getStops } from '@/lib/data/access'

type Props = {
  params: { locale: string; routeId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations()
  const routeId = parseInt(params.routeId)
  const routeData = routes.find((r) => r.routeId === routeId)

  if (!routeData) {
    return {
      title: t('RoutesPage.notFound'),
    }
  }

  return {
    title: `${t('RoutesPage.routes')} ${routeData.routeShortName} - ${
      routeData.routeLongName
    }`,
    description: routeData.routeLongName,
  }
}

export default async function RoutePage({ params }: Props) {
  const t = await getTranslations()
  const routeId = parseInt(params.routeId)

  const routeData = routes.find((r) => r.routeId === routeId)
  if (!routeData) {
    notFound()
  }

  const stops = await getStops()

  return (
    <main className="min-h-screen bg-background px-2 py-8 text-foreground sm:px-4 sm:py-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3">
        {/* Route header */}
        <div className="flex w-full max-w-xl lg:max-w-none flex-col">
          <Card className="w-full p-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl text-center font-bold">
                {t('RoutesPage.routes')} {routeData.routeShortName}
              </h1>
              <p className="text-lg text-center text-muted-foreground">
                {routeData.routeLongName}
              </p>
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-muted text-muted-background py-0.5 px-2 text-sm font-medium">
                  {t(`RoutesPage.routeTypes.${routeData.networkId}`) ??
                    t('RoutesPage.routeTypes.unknown')}
                </span>
                <Link
                  href={`/routes/${routeId}/edit/`}
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                  <svg
                    className="mr-1 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  {t('RoutesPage.suggestEdit')}
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Map and Route Stop List Container */}
        <div className="flex w-full max-w-xl lg:max-w-none flex-col lg:flex-row gap-2">
          {/* Maps Container */}
          <MapsContainer routeData={routeData as Route} />

          {/* Route Stop List */}
          <Card className="w-full lg:w-[400px] h-96 lg:h-[calc(100vh-20rem)] overflow-hidden">
            <RouteStopList routeData={routeData as Route} stops={stops} />
          </Card>
        </div>
      </div>
    </main>
  )
}



