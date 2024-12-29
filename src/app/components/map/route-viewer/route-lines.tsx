'use client'

import { useMap } from 'react-leaflet'
import 'leaflet-arrowheads'
import type { Route } from '@/types/routes'
import type { LatLngTuple } from 'leaflet'
import L from 'leaflet'
import { useEffect, useState, useMemo } from 'react'
import { decode } from '@googlemaps/polyline-codec'

const SHAPE_PATTERNS = {
  direction0: {
    color: '#4f46e5',
    weight: 4,
    opacity: 1,
    frequency: 100,
  },
  direction1: {
    color: '#818cf8',
    weight: 4,
    opacity: 1,
    frequency: 100,
  },
}

export function RouteLines({ routeData }: { routeData: Route }) {
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

  const shapes = useMemo(() => {
    return routeData.trips.map((trip) => {
      const coordinates = decode(trip.fullShape)
      return {
        direction: trip.direction,
        coordinates: coordinates as LatLngTuple[],
      }
    })
  }, [routeData.trips])

  useEffect(() => {
    if (!shapes.length) return

    const polylines: L.Polyline[] = []

    shapes.forEach((shape) => {
      const pattern =
        SHAPE_PATTERNS[
          `direction${shape.direction}` as keyof typeof SHAPE_PATTERNS
        ]
      const polyline = L.polyline(shape.coordinates, pattern)

      if (!isZoomedOut) {
        polyline.arrowheads({
          frequency: 100,
          size: '12px',
          fill: true,
          color: pattern.color,
        })
      }

      polyline.addTo(map)
      polylines.push(polyline)
    })

    return () => {
      polylines.forEach((polyline) => polyline.remove())
    }
  }, [map, shapes, isZoomedOut])

  return null
}
