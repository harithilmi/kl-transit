import { Card } from '~/components/ui/card'
import { notFound } from 'next/navigation'
import { RouteStopList } from '~/app/components/route-stop-list'
import bundledData from '~/data/bundled-data.json'
import type { RouteStopWithData, Stop } from '~/app/types/routes'

export default async function RoutePage({
  params,
}: {
  params: { routeId: string }
}) {
  const { routeId } = params
  if (!routeId) {
    notFound()
  }

  // Using the bundled data
  const routeServices = bundledData.services
    .filter((service) => String(service.route_number) === routeId)
    .sort((a, b) => Number(a.sequence) - Number(b.sequence))

  // Enrich services with stop data
  const servicesWithStops = routeServices
    .map((service) => {
      const stop = bundledData.stops.find(
        (stop) => stop.stop_id === service.stop_id,
      )
      return stop
        ? {
            ...service,
            stop_code: stop.stop_code,
            stop,
            sequence: Number(service.sequence),
          }
        : null
    })
    .filter(
      (
        service,
      ): service is Omit<RouteStopWithData, 'stop' | 'sequence'> & {
        stop: Stop
        sequence: number
      } => service !== null,
    )

  if (servicesWithStops.length === 0) {
    notFound()
  }

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

        {/* Main content */}
        <div className="flex w-full max-w-4xl flex-col gap-6 sm:gap-8">
          <Card className="w-full overflow-hidden text-white">
            <RouteStopList services={servicesWithStops} />
          </Card>

          {/* Map placeholder */}
          <Card className="aspect-video w-full text-white">
            <div className="flex h-full items-center justify-center text-white/50">
              Map coming soon
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
