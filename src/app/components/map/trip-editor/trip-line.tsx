'use client'

import { Polyline } from 'react-leaflet'

interface TripLineProps {
  shape: {
    route_number: string
    direction: 0 | 1
    coordinates: [number, number][]
  }
}

export function TripLine({ shape }: TripLineProps) {
  return (
    <Polyline
      positions={shape.coordinates}
      pathOptions={{
        color: '#2563eb', // blue-600
        weight: 4,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  )
}
