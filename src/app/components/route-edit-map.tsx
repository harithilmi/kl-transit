'use client'

import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'
import 'leaflet-polylinedecorator'

import { useState, useEffect, Fragment, useMemo } from 'react'
import L from 'leaflet'

import type {
  RouteDetails,
  RouteMapWrapperProps,
  SelectedStop,
  Service,
  Stop,
} from '@/types/routes'

import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  LayersControl,
  useMap,
} from 'react-leaflet'
import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { useToast } from '@/app/hooks/use-toast'

import { useUser } from '@clerk/clerk-react'

import { SelectedStopMarker } from '@/app/components/map/selected-stop-marker'
import { PolylineDecorator } from '@/app/components/map/polyline-decorator'
import { ZoomHandler } from '@/app/components/map/zoom-handler'
import { StopConnections } from '@/app/components/map/stop-connections'
import { EditMenu } from '@/app/components/map/edit-menu'
import { MapInteraction } from '@/app/components/map/map-interaction'

// Add this new component for viewport-based markers
function ViewportMarkers({
  stops,
  isTouchDevice,
  handleNonRouteStopClick,
  isRouteStop,
}: {
  stops: SelectedStop[]
  isTouchDevice: boolean
  handleNonRouteStopClick: (stop: Stop) => void
  isRouteStop: (stopId: string) => boolean
}) {
  const map = useMap()
  const [visibleMarkers, setVisibleMarkers] = useState<SelectedStop[]>([])

  // Update visible markers when map moves
  useEffect(() => {
    const updateVisibleMarkers = () => {
      const bounds = map.getBounds()
      const zoom = map.getZoom()

      // Get viewport bounds with padding
      const padded = bounds.pad(0.2) // 20% padding around viewport

      // Filter stops within bounds
      const inBounds = stops.filter((stop) => {
        if (isRouteStop(stop.stop_id)) return false // Skip route stops
        return padded.contains([Number(stop.latitude), Number(stop.longitude)])
      })

      // If zoomed out, reduce marker density
      if (zoom < 15) {
        // Calculate grid size based on zoom
        const gridSize = zoom < 13 ? 0.01 : 0.005 // Adjust these values as needed
        const grid: Record<string, SelectedStop> = {}

        inBounds.forEach((stop) => {
          // Create grid cell key
          const lat = Math.floor(Number(stop.latitude) / gridSize) * gridSize
          const lng = Math.floor(Number(stop.longitude) / gridSize) * gridSize
          const key = `${lat},${lng}`

          // Keep one stop per grid cell
          if (!grid[key]) {
            grid[key] = stop
          }
        })

        setVisibleMarkers(Object.values(grid))
      } else {
        setVisibleMarkers(inBounds)
      }
    }

    // Update on map move/zoom
    map.on('moveend', updateVisibleMarkers)
    map.on('zoomend', updateVisibleMarkers)
    updateVisibleMarkers() // Initial update

    return () => {
      map.off('moveend', updateVisibleMarkers)
      map.off('zoomend', updateVisibleMarkers)
    }
  }, [map, stops, isRouteStop])

  // Memoize marker icon creation
  const markerIcon = useMemo(() => {
    const size = map.getZoom() < 15 ? 12 : 16
    return new L.Icon({
      iconUrl:
        'data:image/svg+xml;base64,' +
        btoa(`
          <svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" fill="white" stroke="#9ca3af" stroke-width="4"/>
          </svg>
        `),
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
  }, [map])

  return (
    <>
      {visibleMarkers.map((stop) => (
        <Marker
          key={stop.id}
          position={[Number(stop.latitude), Number(stop.longitude)]}
          icon={markerIcon}
          eventHandlers={{
            click: () => handleNonRouteStopClick(stop),
          }}
        >
          {!isTouchDevice && (
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
              <div className="flex flex-row items-center gap-2 pr-1">
                {stop.stop_code && (
                  <span className="inline-flex items-center rounded-md bg-gray-400/90 text-white px-2.5 py-0.5 text-sm font-medium">
                    {stop.stop_code}
                  </span>
                )}
                <span className="text-sm font-medium text-gray-600">
                  {stop.stop_name}
                </span>
              </div>
            </Tooltip>
          )}
        </Marker>
      ))}
    </>
  )
}

export default function RouteEditMap({
  routeId,
  services,
  shape,
}: RouteMapWrapperProps) {
  const { toast } = useToast()
  const { user } = useUser()
  const [stops, setStops] = useState<SelectedStop[]>([])
  const [selectedStop, setSelectedStop] = useState<SelectedStop | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(13)
  const [selectedRoutes, setSelectedRoutes] = useState<
    Record<string, RouteDetails>
  >({})
  const [routeColors, setRouteColors] = useState<Record<string, string>>({})
  const [activeDirection, setActiveDirection] = useState<1 | 2>(1)
  const [reorderedStops, setReorderedStops] = useState<Service[]>(services)

  // Add stops data fetching
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const response = await fetch('/api/stops')
        if (!response.ok) {
          throw new Error('Failed to fetch stops')
        }
        const data = (await response.json()) as Stop[]
        const stopsWithRoutes: SelectedStop[] = data.map((stop) => ({
          ...stop,
          route_number: [],
          coordinates: [Number(stop.latitude), Number(stop.longitude)],
        }))
        setStops(stopsWithRoutes)
      } catch (error) {
        console.error('Error fetching stops:', error)
      }
    }

    void fetchStops()
  }, [])

  // Add touch detection on mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window)
  }, [])

  const position: L.LatLngTuple = services[0]?.stop
    ? [
        parseFloat(services[0].stop.latitude),
        parseFloat(services[0].stop.longitude),
      ]
    : [3.139, 101.6869]

  const handleStopClick = (service: typeof services[0] | undefined) => {
    if (!service) return
    fetch(`/api/services?stopId=${service.stop_id}`)
      .then((res) => res.json())
      .then((data: { route_number: string }[]) => {
        const routes = data.map((s) => s.route_number)
        const uniqueRoutes = Array.from(new Set(routes))

        const stopData: SelectedStop = {
          ...service.stop,
          route_number: uniqueRoutes,
          coordinates: [
            Number(service.stop.latitude),
            Number(service.stop.longitude),
          ],
        }
        setSelectedStop(stopData)
      })
      .catch((error) => {
        console.error('Error fetching stop services:', error)
      })
  }

  // Add a function to check if a stop is part of the route
  const isRouteStop = (stopId: string) => {
    return services.some((service) => service.stop_id === stopId)
  }

  // Function to calculate marker size based on zoom level
  const getMarkerSize = (zoom: number) => {
    const baseSize = 10
    const scaleFactor = 1 + (zoom - 13) * 0.2
    return baseSize * scaleFactor
  }

  const handleNonRouteStopClick = (stop: Stop) => {
    // Find all services for this stop from the API
    fetch(`/api/services?stopId=${stop.stop_id}`)
      .then((res) => res.json())
      .then((data: { route_number: string }[]) => {
        const routes = data.map((s) => s.route_number)
        const uniqueRoutes = Array.from(new Set(routes))

        setSelectedStop({
          ...stop,
          route_number: uniqueRoutes,
          coordinates: [Number(stop.latitude), Number(stop.longitude)],
        })
      })
      .catch((error) => {
        console.error('Error fetching stop services:', error)
      })
  }

  // Add function to generate or get color for a route
  const getRouteColor = (routeId: string) => {
    if (routeColors[routeId]) {
      return routeColors[routeId]
    }

    // Generate new color - using HSL for better control
    const hue = Math.random() * 360 // Random hue
    const saturation = 70 + Math.random() * 20 // 70-90%
    const lightness = 45 + Math.random() * 10 // 45-55%

    const newColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    setRouteColors((prev) => ({
      ...prev,
      [routeId]: newColor,
    }))
    return newColor
  }

  // Update the route selection handler to assign color when route is selected
  const handleRouteClick = async (route: string) => {
    // Skip if it's the current route
    if (route === routeId) return

    if (selectedRoutes[route]) {
      const { ...rest } = selectedRoutes
      setSelectedRoutes(rest)
    } else {
      try {
        const baseUrl = window.location.origin
        const res = await fetch(`${baseUrl}/api/routes/${route}`)
        if (!res.ok) throw new Error('Failed to fetch route data')
        const data = (await res.json()) as RouteDetails

        if (!routeColors[route]) {
          getRouteColor(route)
        }

        setSelectedRoutes((prev) => ({
          ...prev,
          [route]: data,
        }))
      } catch (error) {
        console.error('Error fetching route data:', error)
      }
    }
  }

  // Update the cleanup function
  const handleCloseAllRoutes = () => {
    setSelectedRoutes({})
  }

  const handleAddStop = async (stop: SelectedStop) => {
    const newService: Service = {
      id: stop.id,
      stop_id: stop.stop_id,
      route_number: routeId,
      sequence:
        services.filter((s) => s.direction === activeDirection).length + 1,
      direction: activeDirection,
      zone: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stop: stop,
    }

    // Add the new service to the list
    setReorderedStops([...services, newService])
  }

  const handleReorderStops = async (stops: Service[]) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to submit route suggestions')
      }

      const requestData = {
        routeNumber: routeId,
        direction: activeDirection,
        stops: stops.map((stop) => ({
          id: stop.id,
          stopId: stop.stop_id,
          sequence: stop.sequence,
          direction: stop.direction,
          zone: 1,
        })),
      }

      const response = await fetch('/api/route-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? `Server error: ${response.status}`)
      }

      toast({
        title: 'Success',
        description: 'Your route suggestion has been submitted for review.',
      })

      setReorderedStops(
        services.map((service) => ({
          ...service,
          sequence:
            stops.find((s) => s.id === service.id)?.sequence ??
            service.sequence,
        })),
      )
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to submit route suggestion',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="relative h-full w-full">
      <div className="w-full h-full">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          minZoom={15}
          className="w-full h-full"
        >
          <ZoomHandler setZoom={setZoomLevel} />
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Non-route stops with viewport-based rendering */}
          <ViewportMarkers
            stops={stops}
            isTouchDevice={isTouchDevice}
            handleNonRouteStopClick={handleNonRouteStopClick}
            isRouteStop={isRouteStop}
          />

          {/* Original route shape with reduced opacity */}
          {activeDirection === 1 && shape.direction1.coordinates.length > 0 && (
            <PolylineDecorator
              color="rgba(79, 70, 229, 0.2)"
              positions={shape.direction1.coordinates.map((coord) => [
                coord[1],
                coord[0],
              ])}
            />
          )}
          {activeDirection === 2 && shape.direction2.coordinates.length > 0 && (
            <PolylineDecorator
              color="rgba(129, 140, 248, 0.2)"
              positions={shape.direction2.coordinates.map((coord) => [
                coord[1],
                coord[0],
              ])}
            />
          )}

          {/* Add direct connections between stops */}
          <StopConnections
            services={reorderedStops}
            activeDirection={activeDirection}
          />

          {/* Show all stops but style differently based on direction */}
          {services.map((service) => (
            <Marker
              key={`${service.id}-${service.stop_id}-${service.sequence}`}
              position={[
                parseFloat(service.stop.latitude),
                parseFloat(service.stop.longitude),
              ]}
              eventHandlers={{
                click: () => handleStopClick(service),
              }}
              icon={
                new L.Icon({
                  iconUrl:
                    'data:image/svg+xml;base64,' +
                    btoa(`
                    <svg width="${getMarkerSize(
                      zoomLevel,
                    )}" height="${getMarkerSize(
                      zoomLevel,
                    )}" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="10" r="8" fill="white" stroke="${
                        service.direction === activeDirection
                          ? '#1d4ed8'
                          : '#9ca3af'
                      }" stroke-width="4"/>
                    </svg>
                  `),
                  iconSize: [
                    getMarkerSize(zoomLevel),
                    getMarkerSize(zoomLevel),
                  ],
                  iconAnchor: [
                    getMarkerSize(zoomLevel) / 2,
                    getMarkerSize(zoomLevel) / 2,
                  ],
                })
              }
            >
              {!isTouchDevice && (
                <Tooltip
                  direction="top"
                  offset={[0, -10]}
                  opacity={0.9}
                  permanent={false}
                >
                  <div className="flex flex-row items-center gap-2 pr-1">
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium ${
                        service.direction === activeDirection
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {service.stop.stop_code}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        service.direction === activeDirection
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {service.stop.stop_name}
                    </span>
                  </div>
                </Tooltip>
              )}
            </Marker>
          ))}

          {/* Selected route shape */}
          {Object.entries(selectedRoutes).map(([routeId, routeDetails]) => (
            <Fragment key={routeId}>
              {routeDetails.shape.direction1.coordinates.length > 0 && (
                <PolylineDecorator
                  color={routeColors[routeId] ?? getRouteColor(routeId)}
                  positions={routeDetails.shape.direction1.coordinates.map(
                    (coord) => [coord[1], coord[0]],
                  )}
                />
              )}
              {routeDetails.shape.direction2.coordinates.length > 0 && (
                <PolylineDecorator
                  color={routeColors[routeId] ?? getRouteColor(routeId)}
                  positions={routeDetails.shape.direction2.coordinates.map(
                    (coord) => [coord[1], coord[0]],
                  )}
                />
              )}

              {/* Route stops */}
              {routeDetails.services.map((service) => {
                const servingRoutes = Object.entries(
                  selectedRoutes,
                ).filter(([_, route]) =>
                  route.services.some((s) => s.stop_id === service.stop_id),
                )
                const isMultiRoute = servingRoutes.length > 1
                const routeColor =
                  routeColors[routeId] ?? getRouteColor(routeId)

                return (
                  <Marker
                    key={`${routeId}-${service.id}-${service.stop_id}`}
                    position={[
                      parseFloat(service.stop.latitude),
                      parseFloat(service.stop.longitude),
                    ]}
                    eventHandlers={{
                      click: () => handleStopClick(service),
                    }}
                    icon={
                      new L.Icon({
                        iconUrl:
                          'data:image/svg+xml;base64,' +
                          btoa(`
                        <svg width="${getMarkerSize(
                          zoomLevel,
                        )}" height="${getMarkerSize(
                            zoomLevel,
                          )}" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="10" cy="10" r="8" fill="white" stroke="${routeColor}" stroke-width="${
                            isMultiRoute ? 6 : 4
                          }"/>
                          ${
                            isMultiRoute
                              ? `<circle cx="10" cy="10" r="3" fill="${routeColor}"/>`
                              : ''
                          }
                        </svg>
                      `),
                        iconSize: [
                          getMarkerSize(zoomLevel),
                          getMarkerSize(zoomLevel),
                        ],
                        iconAnchor: [
                          getMarkerSize(zoomLevel) / 2,
                          getMarkerSize(zoomLevel) / 2,
                        ],
                      })
                    }
                  >
                    {!isTouchDevice && (
                      <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                        <div className="flex flex-row items-center gap-2 pr-1">
                          <span
                            className="inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium"
                            style={{
                              backgroundColor: routeColor,
                              color: 'white',
                            }}
                          >
                            {service.stop.stop_code}
                          </span>
                          <span className="text-sm font-medium">
                            {service.stop.stop_name}
                          </span>
                        </div>
                      </Tooltip>
                    )}
                  </Marker>
                )
              })}
            </Fragment>
          ))}

          <MapInteraction selectedStop={selectedStop} />
          <SelectedStopMarker
            selectedStop={selectedStop}
            zoomLevel={zoomLevel}
            isTouchDevice={isTouchDevice}
            getMarkerSize={getMarkerSize}
          />
        </MapContainer>
      </div>

      {/* Selected Stop Info Card */}
      {selectedStop && (
        <Card
          className="absolute top-4 left-4 p-4 bg-background/95 backdrop-blur 
          w-[calc(100%-2rem)] sm:w-[400px] max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-32px-400px)] z-[1000]
          overflow-y-auto max-h-[calc(100dvh-2rem)]"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex items-start gap-2">
                {selectedStop.stop_code && (
                  <span className="shrink-0 px-2 py-0.5 bg-primary text-primary-foreground text-sm font-medium rounded-md">
                    {selectedStop.stop_code}
                  </span>
                )}
                <div className="flex flex-col min-w-0">
                  <h3 className="text-lg text-foreground font-semibold truncate">
                    {selectedStop.stop_name}
                  </h3>
                  {selectedStop.street_name && (
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedStop.street_name}
                    </p>
                  )}
                </div>
              </div>

              {selectedStop.route_number.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {selectedStop.route_number.map((route_number) => (
                      <button
                        key={route_number}
                        onClick={() => handleRouteClick(route_number)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs 
                          ${
                            selectedRoutes[route_number]
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          } 
                          hover:bg-secondary/80 transition-colors cursor-pointer 
                          active:ring-2 active:ring-ring active:ring-offset-2 active:ring-offset-background`}
                      >
                        {route_number}
                      </button>
                    ))}
                  </div>
                  {Object.keys(selectedRoutes).length > 0 && (
                    <div className="mt-3 p-2 bg-muted rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Selected Routes</h4>
                          <div className="mt-2 space-y-2">
                            {Object.entries(selectedRoutes).map(
                              ([routeId, details]) => (
                                <div
                                  key={routeId}
                                  className="flex justify-between items-center p-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <span
                                        className="text-sm font-medium text-white px-2 py-0.5 rounded"
                                        style={{
                                          backgroundColor:
                                            routeColors[routeId] ??
                                            getRouteColor(routeId),
                                        }}
                                      >
                                        Route {routeId}
                                      </span>
                                      <p className="text-xs text-muted-foreground">
                                        {details.route_name}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => {
                                      const { ...rest } = selectedRoutes
                                      setSelectedRoutes(rest)
                                    }}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                    variant="destructive"
                                  >
                                    X
                                  </Button>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                        <button
                          onClick={handleCloseAllRoutes}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Close All
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedStop(null)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              ✕
            </button>
          </div>
        </Card>
      )}

      {/* Add the EditMenu component */}
      <EditMenu
        services={services}
        selectedStop={selectedStop}
        onAddStop={handleAddStop}
        onReorderStops={handleReorderStops}
        activeDirection={activeDirection}
        setActiveDirection={setActiveDirection}
        setReorderedStops={setReorderedStops}
        setSelectedStop={setSelectedStop}
        routeId={routeId}
      />
    </div>
  )
}
