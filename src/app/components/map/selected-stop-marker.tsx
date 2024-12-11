import type { SelectedStop } from '@/types/routes'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'

// Add this new component near the other helper components
export function SelectedStopMarker({
  selectedStop,
  zoomLevel,
  isTouchDevice,
  getMarkerSize,
}: {
  selectedStop: SelectedStop | null
  zoomLevel: number
  isTouchDevice: boolean
  getMarkerSize: (zoom: number) => number
}) {
  if (!selectedStop) return null

  return (
    <Marker
      position={selectedStop.coordinates}
      icon={
        new L.Icon({
          iconUrl:
            'data:image/svg+xml;base64,' +
            btoa(`
				<svg width="${getMarkerSize(zoomLevel) * 1.2}" height="${
              getMarkerSize(zoomLevel) * 1.5
            }" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
				  <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24c0-6.6-5.4-12-12-12Z" fill="#1d4ed8"/>
				  <circle cx="12" cy="12" r="8" fill="white"/>
				</svg>
			  `),
          iconSize: [
            getMarkerSize(zoomLevel) * 1.2,
            getMarkerSize(zoomLevel) * 1.5,
          ],
          iconAnchor: [
            getMarkerSize(zoomLevel) * 0.6,
            getMarkerSize(zoomLevel) * 1.5,
          ],
        })
      }
    >
      {!isTouchDevice && (
        <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
          <div className="flex flex-row items-center gap-2 pr-1">
            {selectedStop.code && (
              <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium bg-primary text-primary-foreground">
                {selectedStop.code}
              </span>
            )}
            <span className="text-sm font-medium">{selectedStop.name}</span>
          </div>
        </Tooltip>
      )}
    </Marker>
  )
}
