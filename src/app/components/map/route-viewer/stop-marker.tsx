'use client'

import { Marker, Tooltip, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useMemo } from 'react'
import { useStops } from '@/app/hooks/use-stop-data'
import { Badge } from '@/components/ui/badge'

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
      <Tooltip direction="top">
        <div className="flex">
          <div className="flex flex-col bg-white p-2 rounded-md">
            <div className="flex justify-start gap-1">
              {stop.stop_code && (
                <Badge variant="secondary" className="shrink-0">
                  {stop.stop_code}
                </Badge>
              )}
            </div>
            <span className="font-medium">{stop.stop_name}</span>
            {stop.street_name && (
              <span className="text-muted-foreground">
                {stop.street_name}
              </span>
            )}
          </div>
        </div>
      </Tooltip>
    </Marker>
  )
}
