import { useMapEvents } from 'react-leaflet'

export function ZoomHandler({ setZoom }: { setZoom: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom())
    },
  })
  return null
}
