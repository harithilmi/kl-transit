'use client'

import type { Route } from '@/types/routes'
import { StopMarker } from './stop-marker'
import { useMemo } from 'react'
import { useStops } from '@/app/hooks/use-stop-data'

export function StopsLayer({ routeData }: { routeData: Route }) {
  const { data: allStops } = useStops()

  const stops = useMemo(() => {
    if (!allStops) return []
    const stopIds = new Set<number>()
    const stopDetails = routeData.trips.flatMap((trip) => trip.stopDetails)
    return stopDetails
      .filter((stop) => {
        if (stopIds.has(stop.stopId)) return false
        stopIds.add(stop.stopId)
        return true
      })
      .map((stopDetail) =>
        allStops.find((s) => s.stop_id === stopDetail.stopId),
      )
      .filter((stop): stop is NonNullable<typeof stop> => stop !== undefined)
  }, [routeData.trips, allStops])

  if (!allStops) return null

  return (
    <>
      {stops.map((stop) => (
        <StopMarker key={stop.stop_id} stop={stop} />
      ))}
    </>
  )
}
