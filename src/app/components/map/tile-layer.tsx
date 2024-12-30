import { TileLayer } from 'react-leaflet'

interface Props {
  isSatellite: boolean
}

export function TileLayerComponent({ isSatellite }: Props) {
  const getMapUrl = () => {
    if (isSatellite) {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    }
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  }

  const getAttribution = () => {
    if (isSatellite) {
      return '&copy; <a href="https://www.esri.com/">Esri</a>'
    }
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }

  return <TileLayer attribution={getAttribution()} url={getMapUrl()} />
}
