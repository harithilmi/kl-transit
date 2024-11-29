'use client'

import { useEffect } from 'react'
import { RouteMap } from './route-map'
import { Card } from '~/components/ui/card'
import type { RouteMapWrapperProps } from '../types/routes'

const clearMapCache = () => {
  if (typeof window !== 'undefined') {
    const mapInstanceCache = new Map()
    mapInstanceCache.clear()
  }
}

export function RouteMapWrapper({
  routeId,
  services,
  shape,
}: RouteMapWrapperProps) {
  useEffect(() => {
    return () => {
      clearMapCache()
    }
  }, [routeId])

  return (
    <Card className="w-full max-w-xl h-96 overflow-hidden">
      <RouteMap services={services} shape={shape} />
    </Card>
  )
}
