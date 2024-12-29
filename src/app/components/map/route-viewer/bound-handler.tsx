'use client'

import { useMap } from 'react-leaflet'
import { useEffect, useRef } from 'react'
import { latLngBounds } from 'leaflet'

interface FitBoundsProps {
  allCoordinates: [number, number][]
  zoom?: number
}

export function FitBounds({ allCoordinates, zoom }: FitBoundsProps) {
  const map = useMap()
  const prevCoords = useRef<string>('')

  useEffect(() => {
    // Convert coordinates to string for comparison
    const coordsString = JSON.stringify(allCoordinates)

    // Only update if coordinates have changed
    if (coordsString !== prevCoords.current && allCoordinates.length > 0) {
      prevCoords.current = coordsString

      // Create bounds from coordinates (already in [lat, lng] format)
      const bounds = latLngBounds(allCoordinates)

      // Fit the map to the bounds with some padding
      map.fitBounds(bounds, {
        padding: [50, 50], // Add 50px padding around the bounds
        maxZoom: zoom, // Respect max zoom if provided
      })
    }
  }, [allCoordinates, zoom, map])

  return null
}
