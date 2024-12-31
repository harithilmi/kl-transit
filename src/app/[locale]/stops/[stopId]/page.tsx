import { Card } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { type Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i8n/routing'
import { getStops, getRoutes } from '@/lib/data/access'
import ClientStopPage from './client-page'
import type { Route } from '@/types/routes'

type Props = {
  params: { locale: string; stopId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations()
  // eslint-disable-next-line @typescript-eslint/await-thenable
  const { stopId: stopIdStr } = await params
  const stopId = parseInt(stopIdStr)
  const stops = await getStops()
  const stopData = stops.find((s) => s.stop_id === stopId)

  if (!stopData) {
    return {
      title: t('StopsPage.notFound'),
    }
  }

  return {
    title: `${stopData.stop_name} - ${t('StopsPage.stop')}`,
    description: stopData.street_name,
  }
}

export async function generateStaticParams() {
  const stops = await getStops()
  return stops.map((stop) => ({
    stopId: stop.stop_id.toString(),
  }))
}

export default async function StopPage({ params }: Props) {
  const t = await getTranslations()
  const stopId = parseInt(params.stopId)
  const stops = await getStops()
  const routesData = await getRoutes()
  
  const stopData = stops.find((s) => s.stop_id === stopId)
  if (!stopData) {
    notFound()
  }

  // Ensure routesData is an array
  const routes = Array.isArray(routesData) ? routesData : [routesData]

  // Find all routes that serve this stop
  const servingRoutes = routes.filter((route: Route) => 
    route.trips.some((trip) => 
      trip.stopDetails.some((stop) => stop.stopId === stopId)
    )
  )

  return (
    <main className="bg-background px-2 py-8 text-foreground sm:px-4 h-[calc(100vh-64px)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 h-full">
        {/* Stop header */}
        <div className="flex w-full max-w-xl lg:max-w-none flex-col">
          <Card className="w-full p-4">
            <div className="flex flex-col gap-2">
              <div className="bg-muted rounded-md p-2 justify-center items-center">
                {stopData.stop_code && (
                  <h1 className="text-3xl text-center font-bold">
                    {stopData.stop_code}
                  </h1>
                )}
              </div>
              <h1 className="text-3xl text-center font-bold">
                {stopData.stop_name}
              </h1>
              {stopData.street_name && (
                <p className="text-lg text-center text-muted-foreground">
                  {stopData.street_name}
                </p>
              )}
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-muted text-muted-background py-0.5 px-2 text-sm font-medium">
                  {t('StopsPage.servingRoutes', { servingRoutes: servingRoutes.length })}
                </span>
                <Link
                  href={`/stops/${stopId}/edit/`}
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
                  {t('StopsPage.suggestEdit')}
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Map and Stop Details Container */}
        <div className="w-full flex-1">
          <ClientStopPage stopData={stopData} routes={routes} />
        </div>
      </div>
    </main>
  )
}



