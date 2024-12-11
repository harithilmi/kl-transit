import { Polyline } from 'react-leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Map as LeafletMap } from 'leaflet'

import 'leaflet-polylinedecorator'

type Pattern = L.Pattern
type PatternOptions = L.PolylineDecoratorOptions

export function PolylineDecorator({
  positions,
  color,
}: {
  positions: L.LatLngExpression[]
  color: string
}) {
  const map: LeafletMap = useMap()

  useEffect(() => {
    if (positions.length === 0) return

    const polyline = L.polyline(positions, { color })
    const pattern: Pattern = {
      offset: '25%',
      repeat: 50,
      symbol: L.Symbol.arrowHead({
        pixelSize: 15,
        polygon: false,
        pathOptions: { color, fillOpacity: 1, weight: 2 },
      }),
    }

    const decoratorOptions: PatternOptions = {
      patterns: [pattern],
    }

    const decorator = L.polylineDecorator(polyline, decoratorOptions).addTo(map)

    return () => {
      decorator.remove()
      polyline.remove()
    }
  }, [positions, color, map])

  return <Polyline pathOptions={{ color }} positions={positions} />
}
