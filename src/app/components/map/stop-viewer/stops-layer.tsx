'use client'

import { useStops } from '@/app/hooks/use-stop-data'
import type { Stop } from '@/types/routes'
import { useMemo } from 'react'
import { StopMarker } from './stop-marker'
export function StopsLayer({ stopData }: { stopData: Stop }) {
  const { data: allStops } = useStops()

  const stops = useMemo(() => {
    if (!allStops) return []
    return allStops.filter((stop) => stop.stop_id === stopData.stop_id)
  }, [allStops, stopData])

  return stops.map((stop) => <StopMarker key={stop.stop_id} stop={stop} />)
}
