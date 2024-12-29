'use client'

import type { Stop } from '@/types/routes'
import { Tooltip as LeafletTooltip, Marker } from 'react-leaflet'
import L from 'leaflet'

export const createStopIcon = (color: string, opacity: number) => {
  return L.divIcon({
    html: `<svg width="24" height="24" viewBox="0 0 36.352 36.352" style="opacity: ${opacity}">
		<path d="M36.345 33.122C36.345 34.906 34.9 36.352 33.116 36.352L3.224 36.352C1.44 36.352 0 34.906 0 33.122L0 3.237C0 1.446 1.44 0 3.224 0L33.116 0C34.9 0 36.345 1.446 36.345 3.237L36.345 33.122Z" fill="${color}"/>
		<path d="M24.7482 28.0342L11.6038 28.0342L11.6038 29.3487C11.6038 30.0746 11.0154 30.6631 10.2894 30.6631L8.97499 30.6631C8.24905 30.6631 7.66056 30.0746 7.66056 29.3487L7.66056 28.0342L6.34613 28.0342L6.34613 17.5188L5.03169 17.5188L5.03169 12.2611L6.34613 12.2611L6.34613 8.31777C6.34613 6.86589 7.52311 5.68891 8.97499 5.68891L27.377 5.68891C28.8289 5.68891 30.0059 6.86589 30.0059 8.31777L30.0059 12.2611L31.3203 12.2611L31.3203 17.5188L30.0059 17.5188L30.0059 28.0342L28.6914 28.0342L28.6914 29.3487C28.6914 30.0746 28.103 30.6631 27.377 30.6631L26.0626 30.6631C25.3366 30.6631 24.7482 30.0746 24.7482 29.3487L24.7482 28.0342ZM8.97499 8.31777L8.97499 20.1476L27.377 20.1476L27.377 8.31777L8.97499 8.31777ZM8.97499 22.7765L8.97499 25.4054L14.2327 25.4054L14.2327 22.7765L8.97499 22.7765ZM22.1193 22.7765L22.1193 25.4054L27.377 25.4054L27.377 22.7765L22.1193 22.7765Z" fill="#ffffff"/>
	  </svg>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

const defaultMarkerIcon = createStopIcon('#f7a11a', 0.6)

export function StopMarker({ stop }: { stop: Stop }) {
  return (
    <Marker icon={defaultMarkerIcon} position={[stop.latitude, stop.longitude]}>
      <LeafletTooltip
        direction="top"
        offset={[0, -15]}
        permanent={false}
        className={`shadcn-tooltip`}
      >
        <div className="flex items-center gap-2 p-2 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 rounded-lg bg-background text-foreground translate-y-1">
          {stop.stop_code && (
            <p className="px-2 py-1 bg-primary rounded-md text-primary-foreground font-medium">
              {stop.stop_code}
            </p>
          )}
          <p className="text-sm font-medium text-foreground">
            {stop.stop_name}
          </p>
        </div>
      </LeafletTooltip>
    </Marker>
  )
}
