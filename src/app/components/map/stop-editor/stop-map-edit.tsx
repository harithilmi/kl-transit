'use client'

import { MapContainer, useMap, useMapEvents, ZoomControl } from 'react-leaflet'
import { useState, useEffect, useCallback } from 'react'
import type { Stop } from '@/types/routes'
import type { NewStop } from './stop-editor-context'
import { Button } from '@/components/ui/button'
import { StopEditorProvider, useStopEditor } from './stop-editor-context'
import { StopMarker } from './stop-marker'
import { StopEditorTileLayer } from '../tile-layer'
import { LayersIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditOverlay } from './edit-overlay'
import { NavigationGuard } from './navigation-guard'

import 'leaflet/dist/leaflet.css'

function StopsLayer({ stops }: { stops: Stop[] }) {
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null)
  const [visibleStops, setVisibleStops] = useState<Stop[]>([])
  const { newStops, handleStopMove } = useStopEditor()
  const map = useMap()

  // Update visible stops when map moves or zooms
  const updateVisibleStops = useCallback(() => {
    const zoom = map.getZoom()
    const bounds = map.getBounds()

    // Calculate buffer bounds (one viewport size in each direction)
    const bufferLat = Math.abs(bounds.getNorth() - bounds.getSouth())
    const bufferLng = Math.abs(bounds.getEast() - bounds.getWest())

    const extendedBounds = bounds.extend([
      [bounds.getNorth() + bufferLat, bounds.getEast() + bufferLng],
      [bounds.getSouth() - bufferLat, bounds.getWest() - bufferLng],
    ])

    // Filter stops based on zoom level and extended bounds
    const filtered = stops.filter((stop) => {
      if (zoom < 15) return false
      return extendedBounds.contains([stop.latitude, stop.longitude])
    })

    setVisibleStops(filtered)
  }, [map, stops])

  // Update visible stops when map moves or zooms
  useMapEvents({
    moveend: updateVisibleStops,
    zoomend: updateVisibleStops,
  })

  // Initialize visible stops on mount
  useEffect(() => {
    updateVisibleStops()
  }, [stops, updateVisibleStops])

  function onDragEnd(stopId: number, lat: number, lng: number) {
    if (stopId !== selectedStopId) return
    handleStopMove(stopId, lat, lng)
  }

  function onClick(stopId: number) {
    setSelectedStopId(stopId === selectedStopId ? null : stopId)
  }

  return (
    <>
      {visibleStops.map((stop) => (
        <StopMarker
          key={stop.stop_id}
          stop={stop}
          isDraggable={stop.stop_id === selectedStopId}
          onDragEnd={onDragEnd}
          onClick={onClick}
        />
      ))}
      {newStops.map((stop) => (
        <StopMarker
          key={stop.stop_id}
          stop={stop}
          isDraggable={stop.stop_id === selectedStopId}
          onDragEnd={onDragEnd}
          onClick={onClick}
          isNewStop
        />
      ))}
    </>
  )
}

function AddStopLayer() {
  const { isAddingStop, handleNewStopAdd, setIsAddingStop } = useStopEditor()
  const map = useMap()

  useMapEvents({
    click: (e) => {
      if (!isAddingStop) return

      const newStop: NewStop = {
        stop_id: Date.now(), // Temporary ID for new stop
        stop_code: '',
        stop_name: '',
        street_name: '',
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
        old_stop_id: `N${e.latlng.lat}E${e.latlng.lng}`, // Generate old_stop_id from coordinates
      }

      handleNewStopAdd(newStop)
      setIsAddingStop(false) // Ensure we exit adding mode after adding a stop
    },
  })

  useEffect(() => {
    if (isAddingStop) {
      map.getContainer().style.cursor = 'crosshair'
    } else {
      map.getContainer().style.cursor = ''
    }
  }, [isAddingStop, map])

  return null
}

export default function StopMapEdit({ stops }: { stops: Stop[] }) {
  return (
    <StopEditorProvider>
      <NavigationGuard />
      <StopMapEditContent stops={stops} />
    </StopEditorProvider>
  )
}

function StopMapEditContent({ stops }: { stops: Stop[] }) {
  const { setIsAddingStop, isAddingStop } = useStopEditor()

  return (
    <div className="h-full flex relative">
      <div className="flex-1">
        <MapContainer
          className="h-full w-full"
          center={[3.1412, 101.68653]}
          zoom={15}
          scrollWheelZoom
          zoomControl={false}
        >
          <LayerControls />
          <StopsLayer stops={stops} />
          <AddStopLayer />
          <ZoomControl position="bottomright" />
        </MapContainer>
      </div>
      {/* Fixed Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-4">
        {isAddingStop ? (
          <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border">
            <div className="text-primary font-medium animate-pulse">
              Click map to add stop
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsAddingStop(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <Button
              size="lg"
              className="shadow-lg"
              onClick={() => setIsAddingStop(true)}
            >
              Add Stop
            </Button>
            <EditOverlay stops={stops} />
          </>
        )}
      </div>
    </div>
  )
}

function LayerControls() {
  const { isSatellite, setIsSatellite } = useStopEditor()

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <LayersIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsSatellite(false)}>
            Map View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsSatellite(true)}>
            Satellite View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <MapTileLayer isSatellite={isSatellite} />
    </div>
  )
}

function MapTileLayer({ isSatellite }: { isSatellite: boolean }) {
  const map = useMap()

  // Update map options based on satellite mode
  useEffect(() => {
    if (isSatellite) {
      map.options.minZoom = 12 // Restrict zoom for satellite view
    } else {
      map.options.minZoom = 10
    }
    map.setZoom(map.getZoom()) // Refresh zoom constraints
  }, [isSatellite, map])

  return <StopEditorTileLayer isSatellite={isSatellite} />
}
