'use client'

import { Card } from '@/components/ui/card'
import type { Route, Stop } from '@/types/routes'
import { RouteStopList } from '@/components/routes/route-stop-list'
import { MapsContainer } from './maps-container'
import { SelectedStopProvider } from '@/components/map/route-viewer/selected-stop-context'
import { MapProvider } from '@/components/map/route-viewer/map-context'
import { useState } from 'react'
import type { Map } from 'leaflet'

interface RouteViewerProps {
  routeData: Route
  stops: Stop[]
}

export function RouteViewer({ routeData, stops }: RouteViewerProps) {
  const [map, setMap] = useState<Map | null>(null)

  return (
    <div className="flex mx-auto w-full max-w-xl lg:max-w-none flex-col lg:flex-row gap-2">
      <MapProvider value={{ map, setMap }}>
        <SelectedStopProvider>
          {/* Maps Container */}
          <MapsContainer routeData={routeData} />

          {/* Route Stop List */}
          <Card className="w-full lg:w-[400px] h-96 lg:h-[calc(100vh-20rem)] overflow-hidden">
            <RouteStopList routeData={routeData} stops={stops} />
          </Card>
        </SelectedStopProvider>
      </MapProvider>
    </div>
  )
}
