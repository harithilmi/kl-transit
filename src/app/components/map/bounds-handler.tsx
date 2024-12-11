import { useEffect } from 'react'
import { useMapEvents } from 'react-leaflet'
import type { LatLngBounds } from 'leaflet'

export function BoundsHandler({
  setBounds,
}: {
  setBounds: (bounds: L.LatLngBounds) => void
}) {
  const map = useMapEvents({
    moveend: () => {
      setBounds(map.getBounds())
    },
    zoomend: () => {
      setBounds(map.getBounds())
    },
  })

  // Set initial bounds
  useEffect(() => {
    setBounds(map.getBounds())
  }, [map, setBounds])

  return null
}
