'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer } from 'react-leaflet'
import { FitBounds } from './bound-handler'
import { TileLayerComponent } from '../tile-layer'
import type { Route } from '@/types/routes'
import { RouteLines } from './route-lines'
import { StopsLayer } from './stops-layer'
import { decode } from '@googlemaps/polyline-codec'
import { useMemo } from 'react'

interface RouteMapViewerProps {
  routeData: Route
  isSatellite?: boolean
}

export function RouteMapViewer({
  routeData,
  isSatellite = false,
}: RouteMapViewerProps) {
  const allCoordinates = useMemo(() => {
    return routeData.trips.flatMap((trip) => {
      const coordinates = decode(trip.fullShape)
      return coordinates.map(([lat, lng]) => [lat, lng] as [number, number])
    })
  }, [routeData.trips])

  return (
    <MapContainer
      className="h-full w-full"
      center={[3.1412, 101.68653]}
      zoom={13}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
      minZoom={12}
    >
      {allCoordinates && <FitBounds allCoordinates={allCoordinates} />}
      <TileLayerComponent isSatellite={isSatellite} />
      <RouteLines routeData={routeData} />
      <StopsLayer routeData={routeData} />
    </MapContainer>
  )
}
