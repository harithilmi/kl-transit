'use client'

import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import type { Stop } from '@/types/routes'

interface StopWithSequence extends Stop {
  sequences: {
    direction1?: number
    direction2?: number
  }
}

const CONNECTION_PATTERNS = {
  direction1: {
    color: '#4f46e5',
    weight: 2,
  },
  direction2: {
    color: '#818cf8',
    weight: 2,
  },
}

export function StopConnections({ stops }: { stops: StopWithSequence[] }) {
  const map = useMap()

  useEffect(() => {
    const lines: L.Polyline[] = []

    // Create lines for direction 1
    const direction1Stops = [...stops]
      .filter(
        (
          stop,
        ): stop is StopWithSequence & { sequences: { direction1: number } } =>
          stop.sequences.direction1 !== undefined,
      )
      .sort((a, b) => a.sequences.direction1 - b.sequences.direction1)

    // Create lines for direction 2
    const direction2Stops = [...stops]
      .filter(
        (
          stop,
        ): stop is StopWithSequence & { sequences: { direction2: number } } =>
          stop.sequences.direction2 !== undefined,
      )
      .sort((a, b) => a.sequences.direction2 - b.sequences.direction2)

    // Draw lines for direction 1
    for (let i = 0; i < direction1Stops.length - 1; i++) {
      const current = direction1Stops[i]
      const next = direction1Stops[i + 1]

      const line = L.polyline(
        [
          [current.latitude, current.longitude],
          [next.latitude, next.longitude],
        ],
        CONNECTION_PATTERNS.direction1,
      )
      line.addTo(map)
      lines.push(line)
    }

    // Draw lines for direction 2
    for (let i = 0; i < direction2Stops.length - 1; i++) {
      const current = direction2Stops[i]
      const next = direction2Stops[i + 1]

      const line = L.polyline(
        [
          [current?.latitude, current?.longitude],
          [next?.latitude, next?.longitude],
        ],
        CONNECTION_PATTERNS.direction2,
      )
      line.addTo(map)
      lines.push(line)
    }

    return () => {
      lines.forEach((line) => line.remove())
    }
  }, [map, stops])

  return null
}
