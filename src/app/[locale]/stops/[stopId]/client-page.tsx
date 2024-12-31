'use client'

import { Card } from '@/components/ui/card'
import dynamic from 'next/dynamic'
import type { Stop, Route } from '@/types/routes'
import LoadingSpinner from '@/components/layout/loading-spinner'
import { StopDetails } from '@/app/components/stops/stop-details'
const StopMapViewer = dynamic(
  () =>
    import('@/app/components/map/stop-viewer/stop-map-viewer').then(
      (mod) => mod.StopMapViewer,
    ),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
  },
)

export default function ClientStopPage({
  stopData,
  routes,
}: {
  stopData: Stop
  routes: Route[]
}) {
  return (
    <div className="grid lg:grid-cols-[1fr,400px] gap-4">
      <Card className="w-full h-96 lg:h-[calc(100vh-20rem)] overflow-hidden">
        <StopMapViewer stopData={stopData} />
      </Card>
      <div className="w-full lg:h-[calc(100vh-20rem)] overflow-y-auto">
        <StopDetails stopData={stopData} routes={routes} />
      </div>
    </div>
  )
}
