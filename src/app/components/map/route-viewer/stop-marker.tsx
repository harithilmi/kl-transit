'use client'

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useMemo } from 'react'
import { useStops } from '@/app/hooks/use-stop-data'

const STOP_ICON = L.divIcon({
  className: 'bg-transparent',
  html: `<div class="w-3 h-3 rounded-full bg-primary border-2 border-primary"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

interface StopMarkerProps {
  stopId: number
}

export function StopMarker({ stopId }: StopMarkerProps) {
  const { data: stops } = useStops()
  const stop = stops?.find((s) => s.stop_id === stopId)

  const position = useMemo(
    () => (stop ? ([stop.latitude, stop.longitude] as [number, number]) : null),
    [stop],
  )

  if (!position || !stop) return null

  return (
    <Marker position={position} icon={STOP_ICON}>
      <Popup>
        <div className="flex flex-col gap-1">
          {stop.stop_code && (
            <span className="text-sm text-muted-foreground">
              {stop.stop_code}
            </span>
          )}
          <span className="font-medium">{stop.stop_name}</span>
          {stop.street_name && (
            <span className="text-sm text-muted-foreground">
              {stop.street_name}
            </span>
          )}
        </div>
      </Popup>
    </Marker>
  )
}
