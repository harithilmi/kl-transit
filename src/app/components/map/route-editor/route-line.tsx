'use client'

import { useMap } from 'react-leaflet'
import 'leaflet-arrowheads'
import type { Shape } from '@/types/routes'
import L from 'leaflet'
import { useEffect, useState } from 'react'

const SHAPE_PATTERNS = {
  direction1: {
    color: 'white',
    weight: 4,
    opacity: 0.3,
    dashArray: '5, 5',
  },
  direction2: {
    color: 'white',
    weight: 4,
    opacity: 0.3,
    dashArray: '5, 5',
  },
}

const flipCoordinates = (coords: [number, number][]): [number, number][] =>
  coords?.map(([lng, lat]) => [lat, lng]) ?? []

// const offsetCoordinates = (coordinates: [number, number][], offset: number) => {
//   return coordinates.map(([lng, lat]) => [lng + offset, lat])
// }

export function RouteLines({
  shape,
}: {
  shape: {
    direction1?: Shape
    direction2?: Shape
  }
}) {
  const map = useMap()
  const [isZoomedOut, setIsZoomedOut] = useState(map.getZoom() < 14)

  useEffect(() => {
    const handleZoom = () => {
      setIsZoomedOut(map.getZoom() < 14)
    }

    map.on('zoom', handleZoom)
    return () => {
      map.off('zoom', handleZoom)
    }
  }, [map])
  useEffect(() => {
    if (!shape.direction1?.coordinates && !shape.direction2?.coordinates) return

    let polyline1: L.Polyline | undefined
    if (shape.direction1?.coordinates) {
      polyline1 = L.polyline(flipCoordinates(shape.direction1.coordinates), {
        ...SHAPE_PATTERNS.direction1,
      })

      if (!isZoomedOut) {
        polyline1.arrowheads({
          frequency: 100,
          size: '12px',
          fill: false,
          color: 'white',
          opacity: 0.3,
        })
      }

      polyline1.addTo(map)
    }

    let polyline2: L.Polyline | undefined
    if (shape.direction2?.coordinates) {
      polyline2 = L.polyline(flipCoordinates(shape.direction2.coordinates), {
        ...SHAPE_PATTERNS.direction2,
      })

      if (!isZoomedOut) {
        polyline2.arrowheads({
          frequency: 100,
          size: '12px',
          fill: false,
          color: 'white',
          opacity: 0.3,
        })
      }

      polyline2.addTo(map)
    }

    return () => {
      if (polyline1) polyline1.remove()
      if (polyline2) polyline2.remove()
    }
  }, [map, shape, isZoomedOut])

  return null
}
