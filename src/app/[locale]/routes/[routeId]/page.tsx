import { Card } from '@/app/components/ui/card'
import { notFound } from 'next/navigation'
import { RouteStopList } from '@/app/components/route-stop-list'
import type { RouteDetails } from '@/types/routes'
import { type Metadata } from 'next'
import { RouteMapWrapper } from '@/app/components/route-page-client'
import { getTranslations } from 'next-intl/server'

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_APP_URL

type Props = {
  params: { locale: string; routeId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!baseUrl) throw new Error('NEXT_PUBLIC_APP_URL is not defined')

  const t = await getTranslations('RoutesPage')
  const res = await fetch(`${baseUrl}/api/routes/${params.routeId}`, {
    next: {
      revalidate: 86400,
    },
  })

  if (!res.ok) {
    return {
      title: `${t('error.routeNotFound')} - KL Transit`,
      description: t('error.routeNotFoundDescription'),
    }
  }

  const routeData = (await res.json()) as RouteDetails
  return {
		title: `${t('routes')} ${params.routeId} - KL Transit`,
    description: `${t('meta.routeDescription')} ${params.routeId} (${routeData.route_name})`,
  }
}

export default async function RoutePage({
  params,
}: Props) {
  if (!baseUrl) throw new Error('NEXT_PUBLIC_APP_URL is not defined')

  const t = await getTranslations('RoutesPage')
  
  const res = await fetch(`${baseUrl}/api/routes/${params.routeId}`, {
    next: {
      revalidate: 86400,
    },
  })

  if (!res.ok) {
    notFound()
  }

  const routeData = (await res.json()) as RouteDetails

  return (
    <main className="min-h-screen bg-background px-2 py-8 text-foreground sm:px-4 sm:py-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3">
        {/* Back button */}
        <div className="w-full max-w-4xl px-2">
          <a
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
            {t('backToRoutes')}
          </a>
        </div>

        {/* Route header */}
        <div className="flex w-full max-w-xl flex-col gap-6 sm:gap-8">
          <Card className="w-full p-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl text-center font-bold">
                {t('routes')} {routeData.route_number}
              </h1>
              <p className="text-lg text-center text-muted-foreground">
                {routeData.route_name}
              </p>
              <div className="flex justify-center">
                <span className="inline-flex items-center rounded-md bg-muted text-muted-background py-0.5 px-2 text-sm font-medium">
                  {t('routeTypes.' + routeData.route_type) ?? 
                   t('routeTypes.unknown')}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Map */}
        <Card className="w-full max-w-xl h-96 overflow-hidden">
          <RouteMapWrapper
            services={routeData.services}
            shape={routeData.shape}
          />
        </Card>

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
