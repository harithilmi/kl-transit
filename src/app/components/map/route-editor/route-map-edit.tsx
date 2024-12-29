'use client'

import type { RouteDetails, Stop } from '@/types/routes'
import { MapContainer, ZoomControl } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { useMemo } from 'react'
import { StopEditorTileLayer } from '@/app/components/map/tile-layer'
import { RouteLines } from '@/app/components/map/route-editor/route-line'
import { StopConnections } from '@/app/components/map/route-editor/stop-connections'

import 'leaflet/dist/leaflet.css'
import { StopMarker } from './stop-marker'

interface RouteMapEditProps {
  routeData: RouteDetails
  allStops: Stop[]
}

export default function RouteMapEdit({
  routeData,
  allStops = [],
}: RouteMapEditProps) {
  const linePositions = useMemo(() => {
    if (!routeData?.shape?.direction1?.coordinates) return []
    return routeData.shape.direction1.coordinates.map(
      ([lat, lng]): LatLngExpression => [lat, lng],
    )
  }, [routeData?.shape?.direction1])

  const center = linePositions[0] ?? [3.139, 101.6869]

  const routeStops = useMemo(() => {
    if (!routeData?.services || !allStops) return []
    const stopIds = new Set(
      routeData.services.map((service) => service.stop_id),
    )
    return allStops.filter((stop) => stopIds.has(stop.stop_id))
  }, [routeData?.services, allStops])

  const routeStopsWithSequence = useMemo(() => {
    if (!routeData?.services || !allStops) return []

    const sequenceMap: Record<
      number,
      { direction1?: number; direction2?: number }
    > = {}

    routeData.services.forEach((service) => {
      if (!sequenceMap[service.stop_id]) {
        sequenceMap[service.stop_id] = {}
      }
      sequenceMap[service.stop_id][`direction${service.direction}`] =
        service.sequence
    })

    return allStops
      .filter((stop) => sequenceMap[stop.stop_id])
      .map((stop) => ({
        ...stop,
        sequences: sequenceMap[stop.stop_id],
      }))
  }, [routeData?.services, allStops])

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl={false}
      >
        <StopEditorTileLayer isSatellite={false} />
        {routeData?.shape && <RouteLines shape={routeData.shape} />}

        <StopConnections stops={routeStopsWithSequence} />

        {routeStops.map((stop) => (
          <StopMarker key={stop.stop_id} stop={stop} />
        ))}

        <ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  )
}
