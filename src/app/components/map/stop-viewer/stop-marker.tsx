'use client'

import { Marker, Tooltip as LeafletTooltip } from 'react-leaflet'
import type { Stop } from '@/types/routes'
import { STOP_ICON } from '@/lib/map-utils'
import type { LatLngTuple } from 'leaflet'

interface StopMarkerProps {
  stop: Stop
}

export function StopMarker({ stop }: StopMarkerProps) {
  return (
    <Marker
      position={[stop.latitude, stop.longitude] as LatLngTuple}
      icon={STOP_ICON}
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
