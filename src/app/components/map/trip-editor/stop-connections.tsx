'use client'

import { Polyline, useMap, useMapEvents } from 'react-leaflet'
import type { Stop, StopPairSegment } from '@/types/routes'
import type L from 'leaflet'
import 'leaflet-arrowheads'
import { useEffect, useState, useCallback } from 'react'

interface StopConnectionsProps {
  stops: (Stop & { sequence: number })[]
  segments: StopPairSegment[]
  showArrows?: boolean
}

interface ArrowheadsOptions {
  yawn?: number
  size?: string
  frequency?: number
  fill?: boolean
}

type PolylineWithArrowheads = L.Polyline & {
  _arrowheads: unknown
  arrowheads(options: ArrowheadsOptions): L.Polyline
}

// Type guard for polylines with arrowheads
function hasArrowheads(layer: L.Layer): layer is PolylineWithArrowheads {
  return '_arrowheads' in layer
}

export function StopConnections({
  stops,
  segments,
  showArrows = false,
}: StopConnectionsProps) {
  const map = useMap()
  const [visibleStops, setVisibleStops] = useState<
    (Stop & { sequence: number })[]
  >([])

  // Update visible stops when map moves or zooms
  const updateVisibleStops = useCallback(() => {
    const bounds = map.getBounds()

    // Calculate buffer bounds (one viewport size in each direction)
    const bufferLat = Math.abs(bounds.getNorth() - bounds.getSouth())
    const bufferLng = Math.abs(bounds.getEast() - bounds.getWest())

    const extendedBounds = bounds.extend([
      [bounds.getNorth() + bufferLat, bounds.getEast() + bufferLng],
      [bounds.getSouth() - bufferLat, bounds.getWest() - bufferLng],
    ])

    // Filter stops based on extended bounds
    const filtered = stops.filter((stop) => {
      return extendedBounds.contains([stop.latitude, stop.longitude])
    })

    setVisibleStops(filtered)
  }, [map, stops])

  // Update visible stops when map moves or zooms
  useMapEvents({
    moveend: updateVisibleStops,
    zoomend: updateVisibleStops,
  })

  // Initialize visible stops on mount and when stops change
  useEffect(() => {
    updateVisibleStops()
  }, [stops, updateVisibleStops])

  // Sort stops by sequence to ensure correct line drawing order
  const sortedStops = [...visibleStops].sort((a, b) => a.sequence - b.sequence)

  // Create pairs of consecutive stops for drawing lines
  const stopPairs = sortedStops
    .slice(0, -1)
    .map((stop, index) => {
      const nextStop = sortedStops[index + 1]
      if (!nextStop) return null

      const hasShape = segments.some(
        (s) =>
          (s.fromStopId === stop.stop_id && s.toStopId === nextStop.stop_id) ||
          (s.fromStopId === nextStop.stop_id && s.toStopId === stop.stop_id),
      )

      return {
        start: [stop.latitude, stop.longitude] as [number, number],
        end: [nextStop.latitude, nextStop.longitude] as [number, number],
        hasShape,
      }
    })
    .filter((pair): pair is NonNullable<typeof pair> => pair !== null)

  useEffect(() => {
    // Clean up old polylines
    map.eachLayer((layer) => {
      if (hasArrowheads(layer)) {
        map.removeLayer(layer)
      }
    })
  }, [map, visibleStops, segments])

  return (
    <>
      {stopPairs.map(({ start, end, hasShape }, index) => {
        const polylineOptions = {
          color: hasShape ? '#0ea5e9' : '#94a3b8', // blue-500 : slate-400
          weight: 2,
          opacity: hasShape ? 0.3 : 0.5,
          dashArray: hasShape ? undefined : '4, 4',
        }

        return (
          <Polyline
            key={index}
            positions={[start, end]}
            pathOptions={polylineOptions}
            eventHandlers={{
              add: (e) => {
                if (showArrows && !hasShape) {
                  const line = e.target as PolylineWithArrowheads
                  line.arrowheads({
                    size: '10px',
                    frequency: 2,
                    fill: true,
                    yawn: 40,
                  })
                }
              },
            }}
          />
        )
      })}
    </>
  )
}
