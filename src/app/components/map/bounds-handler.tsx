import { useEffect } from 'react'
import { useMapEvents } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'

export function BoundsHandler({
  setBounds,
}: {
  setBounds: (bounds: L.LatLngBounds) => void
}) {
  const map: LeafletMap = useMapEvents({
    moveend: () => {
      setBounds(map.getBounds())
    },
    zoomend: () => {
      setBounds(map.getBounds())
    },
  })

  useEffect(() => {
    setBounds(map.getBounds())
  }, [map, setBounds])

  return null
}
