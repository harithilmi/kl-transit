import type { SelectedStop } from '@/types/routes'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'

export function MapInteraction({
  selectedStop,
}: {
  selectedStop: SelectedStop | null
}) {
  const map: LeafletMap = useMap()

  useEffect(() => {
    if (selectedStop) {
      const currentZoom = map.getZoom()
      map.setView(
        [selectedStop.coordinates[0], selectedStop.coordinates[1]],
        currentZoom,
      )
    }
  }, [selectedStop, map])

  return null
}
