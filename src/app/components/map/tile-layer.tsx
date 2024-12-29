'use client'

import { useTheme } from 'next-themes'
import { TileLayer } from 'react-leaflet'

interface Props {
  isSatellite: boolean
}

export function StopEditorTileLayer({ isSatellite }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const getMapUrl = () => {
    if (isSatellite) {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    }
    return isDark
      ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
      : 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png'
  }

  const getAttribution = () => {
    if (isSatellite) {
      return '&copy; <a href="https://www.esri.com/">Esri</a>'
    }
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }

  return <TileLayer attribution={getAttribution()} url={getMapUrl()} />
}
