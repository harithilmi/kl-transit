'use client'

import { Card } from '@/components/ui/card'
import dynamic from 'next/dynamic'
import type { Route } from '@/types/routes'
import LoadingSpinner from '@/components/layout/loading-spinner'

const RouteMapViewer = dynamic(
  () =>
    import('@/components/map/route-viewer/route-map-viewer').then(
      (mod) => mod.RouteMapViewer,
    ),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
  },
)

export function MapsContainer({ routeData }: { routeData: Route }) {
  return (
    <Card className="w-full lg:flex-1 h-96 lg:h-[calc(100vh-20rem)] overflow-hidden">
      <RouteMapViewer routeData={routeData} />
    </Card>
  )
}
