'use client'

import type { Route } from '@/types/routes'
import { StopMarker } from './stop-marker'
import { useMemo } from 'react'

export function StopsLayer({ routeData }: { routeData: Route }) {
  const stops = useMemo(() => {
    const stopIds = new Set<number>()
    const stopDetails = routeData.trips.flatMap((trip) => trip.stopDetails)
    return stopDetails.filter((stop) => {
      if (stopIds.has(stop.stopId)) return false
      stopIds.add(stop.stopId)
      return true
    })
  }, [routeData.trips])

  return (
    <>
      {stops.map((stop) => (
        <StopMarker key={stop.stopId} stopId={stop.stopId} />
      ))}
    </>
  )
}
