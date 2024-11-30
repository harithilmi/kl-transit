'use client'

import { RouteMap } from './route-map'
import type { Service, RouteShape } from '../../types/routes'

interface RouteMapWrapperProps {
  services: Service[]
  shape: {
    direction1: RouteShape
    direction2: RouteShape
  }
}

export function RouteMapWrapper({ services, shape }: RouteMapWrapperProps) {
  return <RouteMap services={services} shape={shape} />
}
