'use client'

import dynamic from 'next/dynamic'
import type { Service, RouteShape } from '../../types/routes'

const RouteMap = dynamic(
  () => import('./route-map').then((mod) => mod.RouteMap),
  { ssr: false },
)

export function MapWrapper({
  services,
  shape,
}: {
  services: Service[]
  shape: {
    direction1: RouteShape
    direction2: RouteShape
  }
}) {
  return (
    <div className="h-full">
      <RouteMap services={services} shape={shape} />
    </div>
  )
}
