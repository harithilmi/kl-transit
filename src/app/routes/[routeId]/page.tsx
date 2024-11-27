import { Card } from '~/components/ui/card'
import { notFound } from 'next/navigation'
import { RouteStopList } from '~/app/components/route-stop-list'
import { RouteMap } from '~/app/components/route-map'
import type { RouteDetails } from '~/app/types/routes'

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_APP_URL

export default async function RoutePage({
  params,
}: {
  params: { routeId: string }
}) {
  if (!baseUrl) throw new Error('NEXT_PUBLIC_APP_URL is not defined')

  const res = await fetch(`${baseUrl}/api/routes/${params.routeId}`)

  if (!res.ok) {
    notFound()
  }

  const routeData = (await res.json()) as RouteDetails

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] px-2 py-8 text-white sm:px-4 sm:py-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 sm:gap-12">
        {/* Back button */}
        <div className="w-full max-w-4xl px-2">
          <a
            href="/routes"
            className="inline-flex items-center text-sm text-white/70 hover:text-white"
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
            Back to Routes
          </a>
        </div>

        {/* Route header */}
        <div className="flex w-full max-w-xl flex-col gap-6 sm:gap-8">
          <Card className="w-full p-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl text-center font-bold">
                Route {routeData.route_number}
              </h1>
              <p className="text-lg text-center text-white/80">
                {routeData.route_name}
              </p>
            </div>
          </Card>
        </div>

        {/* Map */}
        <Card className="w-full max-w-xl h-96 overflow-hidden">
          <RouteMap services={routeData.services} shape={routeData.shape} />
        </Card>

        {/* Main content */}
        <div className="flex w-full max-w-xl flex-col gap-6 sm:gap-8">
          <Card className="w-full overflow-hidden text-white">
            <RouteStopList services={routeData.services} />
          </Card>
        </div>
      </div>
    </main>
  )
}
