'use client'

import { Marker, Tooltip as LeafletTooltip, useMap } from 'react-leaflet'
import { useMemo } from 'react'
import type { Stop } from '@/types/routes'
import { STOP_ICON, SELECTED_STOP_ICON } from '@/lib/map-utils'
import { useSelectedStop } from './selected-stop-context'
import type { LatLngTuple } from 'leaflet'

interface StopMarkerProps {
  stop: Stop
}

export function StopMarker({ stop }: StopMarkerProps) {
  const { selectedStop, setSelectedStop } = useSelectedStop()
  const map = useMap()

  const position = useMemo(
    () => [stop.latitude, stop.longitude] as LatLngTuple,
    [stop],
  )

  const isSelected = selectedStop?.stop_id === stop.stop_id

  const handleClick = () => {
    if (!isSelected) {
      map.setView(position, 16, {
        animate: true,
        duration: 1,
      })
    }
    setSelectedStop(isSelected ? null : stop)
  }

  return (
    <Marker
      position={position}
      icon={isSelected ? SELECTED_STOP_ICON : STOP_ICON}
      eventHandlers={{
        click: handleClick,
      }}
    >
      <LeafletTooltip
        direction="top"
        offset={[0, -15]}
        permanent={false}
        className="shadcn-tooltip"
      >
        <div className="flex items-center gap-2 p-2 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 rounded-lg bg-background text-foreground translate-y-1">
          {stop.stop_code && (
            <p className="px-2 py-1 bg-primary rounded-md text-primary-foreground font-medium">
              {stop.stop_code}
            </p>
          )}
          <div className="flex flex-col">
            <p className="text-sm font-medium text-foreground">
              {stop.stop_name}
            </p>
            {stop.street_name && (
              <p className="text-sm text-muted-foreground">
                {stop.street_name}
              </p>
            )}
          </div>
        </div>
      </LeafletTooltip>
    </Marker>
  )
}
