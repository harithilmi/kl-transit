'use client'

import 'leaflet/dist/leaflet.css'
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css'

import { MapContainer } from 'react-leaflet'
import { TileLayerComponent } from '@/app/components/map/tile-layer'
import type { Stop } from '@/types/routes'
import { StopsLayer } from '@/app/components/map/stop-viewer/stops-layer'
import L from 'leaflet'
import { GestureHandling } from 'leaflet-gesture-handling'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

declare module 'leaflet' {
  interface MapOptions {
    gestureHandling?: boolean
    gestureHandlingOptions?: {
      text: {
        touch: string
        scroll: string
        scrollMac: string
      }
      duration: number
      touchAction?: string
    }
  }
}

// Add the gesture handling to Leaflet
L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling)

interface StopMapViewerProps {
  stopData: Stop
  isSatellite?: boolean
}

// New component to handle bounds
function BoundsController({ stopData }: { stopData: Stop }) {
  const map = useMap()

  useEffect(() => {
    const bounds = L.latLngBounds([
      [stopData.latitude, stopData.longitude],
      [stopData.latitude, stopData.longitude],
    ]).pad(0.2) // Add 20% padding around the point

    map.fitBounds(bounds)
  }, [map, stopData])

  return null
}

export function StopMapViewer({
  stopData,
  isSatellite = false,
}: StopMapViewerProps) {
  return (
    <MapContainer
      className="h-full w-full"
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
      minZoom={12}
      gestureHandling={true}
      gestureHandlingOptions={{
        text: {
          touch: 'Use two fingers to move the map',
          scroll: 'Use ctrl + scroll to zoom the map',
          scrollMac: 'Use ⌘ + scroll to zoom the map',
        },
        duration: 1000,
        touchAction: 'pan-y',
      }}
    >
      <TileLayerComponent isSatellite={isSatellite} />
      <StopsLayer stopData={stopData} />
      <BoundsController stopData={stopData} />
    </MapContainer>
  )
}
