import { Card } from '@/app/components/ui/card'
import { notFound } from 'next/navigation'
import { RouteStopList } from '@/app/components/route-stop-list'
import { type Metadata } from 'next'
import { MapWrapper } from '@/app/components/map-wrapper'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i8n/routing'
import { routing } from '@/i8n/routing'
import { fetchRouteData } from '@/lib/routes'

type Props = {
  params: { locale: string; routeId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations()
  const { routeId } = params

  const routeData = await fetchRouteData(routeId)
  if (!routeData) {
    return {
      title: `${t('ErrorPage.routeNotFound')} - KL Transit`,
      description: t('ErrorPage.routeNotFoundDescription'),
      openGraph: {
        title: `${t('ErrorPage.routeNotFound')} - KL Transit`,
        description: t('ErrorPage.routeNotFoundDescription'),
        type: 'website',
        siteName: 'KL Transit',
      },
    }
  }

  const title = `${t('RoutesPage.routes')} ${routeId} - KL Transit`
  const description = `${t('RoutesPage.meta.routeDescription')} ${routeId} (${routeData.route_name})`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'KL Transit',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `/routes/${routeId}`,
    },
  }
}

export async function generateStaticParams() {
  const routes = await import('@/data/from_db/kl-transit_route.json')
  
  return routing.locales.flatMap((locale) =>
    routes.default.map((route) => ({
      locale,
      routeId: route.route_number,
    }))
  )
}

export default async function RoutePage({ params }: Props) {
  const t = await getTranslations()
  const { routeId } = params

  const routeData = await fetchRouteData(routeId)
  if (!routeData) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background px-2 py-8 text-foreground sm:px-4 sm:py-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3">
        {/* Back button */}
        <div className="w-full max-w-4xl px-2">
          <Link
            href={`/routes`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
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
            {t('RoutesPage.backToRoutes')}
          </Link>
        </div>

        {/* Route header */}
        <div className="flex w-full max-w-xl flex-col gap-6 sm:gap-8">
          <Card className="w-full p-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl text-center font-bold">
                {t('RoutesPage.routes')} {routeData.route_number}
              </h1>
              <p className="text-lg text-center text-muted-foreground">
                {routeData.route_name}
              </p>
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-muted text-muted-background py-0.5 px-2 text-sm font-medium">
                  {t('RoutesPage.routeTypes.' + routeData.route_type) ?? 
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

        {/* Map */}
        {/* TO avoid wastage of map load, only show this when needed */}
        {/* {process.env.NODE_ENV !== 'development' ? ( */}
          <Card className="w-full max-w-xl h-96 overflow-hidden">
            <MapWrapper
              services={routeData.services}
              shape={routeData.shape}
            />
          </Card>
			{/* ) : (
			<Card className="w-full max-w-xl h-36 sm:h-96 overflow-hidden">
				<div className="h-full w-full flex items-center justify-center bg-muted/50">
				<div className="h-8 w-32 animate-pulse rounded bg-muted" />
				</div>
			</Card>
			)} */}

        {/* Main content */}
        <div className="flex w-full max-w-xl flex-col gap-6 sm:gap-8">
				  <Card className="w-full overflow-hidden">

            <RouteStopList services={routeData.services} />
          </Card>
        </div>
      </div>
    </main>
  )
}

// Force static generation
export const dynamic = 'force-static'
export const revalidate = 3600 // Optional: revalidate every hour
