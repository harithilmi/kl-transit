'use client'

import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'
import 'leaflet-polylinedecorator'

import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  LayersControl,
  useMapEvents,
} from 'react-leaflet'
import type {
  RouteDetails,
  RouteMapWrapperProps,
  Service,
} from '@/types/routes'
import { Card } from '@/app/components/ui/card'
import { useState, useEffect } from 'react'
import { Fragment } from 'react'
import type { SelectedStop, Stop } from '@/types/routes'
import L from 'leaflet'
import { Button } from '@/app/components/ui/button'
import { useToast } from '@/app/hooks/use-toast'
import { useUser } from '@clerk/clerk-react'

interface ServiceResponse {
  route_number: string
  // Add other fields as needed
}

// Helper component to handle map interactions
function MapInteraction({
  selectedStop,
}: {
  selectedStop: SelectedStop | null
}) {
  const map = useMap()

  useEffect(() => {
    if (selectedStop) {
      const currentZoom = map.getZoom()
      map.setView(
        [selectedStop.coordinates[0], selectedStop.coordinates[1]],
        currentZoom,
      )
    }
  }, [selectedStop, map])

  return null
}

// Helper component to handle map bounds
function BoundsHandler({
  setBounds,
}: {
  setBounds: (bounds: L.LatLngBounds) => void
}) {
  const map = useMapEvents({
    moveend: () => {
      setBounds(map.getBounds())
    },
    zoomend: () => {
      setBounds(map.getBounds())
    },
  })

  // Set initial bounds
  useEffect(() => {
    setBounds(map.getBounds())
  }, [map, setBounds])

  return null
}

// Add this new component
function ZoomHandler({ setZoom }: { setZoom: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom())
    },
  })
  return null
}

// Add this new component at the top level
function PolylineDecorator({
  positions,
  color,
}: {
  positions: L.LatLngExpression[]
  color: string
}) {
  const map = useMap()

  useEffect(() => {
    if (positions.length === 0) return

    const polyline = L.polyline(positions, { color })
    const pattern: Pattern = {
      offset: '25%',
      repeat: 50,
      symbol: L.Symbol.arrowHead({
        pixelSize: 15,
        polygon: false,
        pathOptions: { color, fillOpacity: 1, weight: 2 },
      }),
    }

    const decoratorOptions: PatternOptions = {
      patterns: [pattern],
    }

    const decorator = L.polylineDecorator(polyline, decoratorOptions).addTo(map)

    return () => {
      decorator.remove()
      polyline.remove()
    }
  }, [positions, color, map])

  return <Polyline pathOptions={{ color }} positions={positions} />
}

type Pattern = L.Pattern
type PatternOptions = L.PolylineDecoratorOptions

// Add these interfaces near the top
interface RouteStop {
  id: number
  stop_id: string
  sequence: number
  direction: 1 | 2
}

interface EditMenuProps {
  services: Service[]
  selectedStop: SelectedStop | null
  onAddStop: (stop: SelectedStop) => void
  onReorderStops: (stops: RouteStop[]) => void
  activeDirection: 1 | 2
  setActiveDirection: React.Dispatch<React.SetStateAction<1 | 2>>
  setReorderedStops: (stops: Service[]) => void
  setSelectedStop: (stop: SelectedStop | null) => void
  routeId: string
}

// Add this new component
function EditMenu({
  services,
  selectedStop,
  onAddStop,
  onReorderStops,
  activeDirection,
  setActiveDirection,
  setReorderedStops,
  setSelectedStop,
  routeId,
}: EditMenuProps) {
  const [reorderedServices, setReorderedServices] = useState(services)
  const [hasChanges, setHasChanges] = useState(false)
  const [draggedStop, setDraggedStop] = useState<Service | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isMinimized, setIsMinimized] = useState(true)

  // Reset reordered services when direction changes
  useEffect(() => {
    setReorderedServices(services)
    setHasChanges(false)
  }, [services, activeDirection])

  // Sort services by sequence and split by direction
  const sortedServices = [...reorderedServices].sort(
    (a, b) => a.sequence - b.sequence,
  )
  const currentDirectionServices = sortedServices.filter(
    (s) => s.direction === activeDirection,
  )
  const otherDirectionServices = sortedServices.filter(
    (s) => s.direction !== activeDirection,
  )

  const handleDragStart = (
    e: React.DragEvent,
    service: Service,
    index: number,
  ) => {
    e.stopPropagation()
    setDraggedStop(service)
    // Store the index in the dataTransfer
    e.dataTransfer.setData('text/plain', index.toString())
    // Add a visual effect
    const target = e.target as HTMLElement
    setTimeout(() => {
      target.style.opacity = '0.4'
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation()
    setDraggedStop(null)
    setDragOverIndex(null)
    // Reset opacity
    const target = e.target as HTMLElement
    target.style.opacity = '1'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (draggedStop && dragIndex !== dropIndex) {
      const stopsToReorder = [...currentDirectionServices]
      const removed = stopsToReorder[dragIndex]
      if (!removed) return

      stopsToReorder.splice(dragIndex, 1)
      stopsToReorder.splice(dropIndex, 0, removed)

      // Update sequences
      const updatedStops = stopsToReorder.map((stop, index) => ({
        ...stop,
        sequence: index + 1,
      }))

      // Combine with other direction's stops
      const newServices = [...updatedStops, ...otherDirectionServices]
      setReorderedServices(newServices)
      setReorderedStops(newServices)
      setHasChanges(true)
    }

    setDraggedStop(null)
    setDragOverIndex(null)
  }

  const handleSaveChanges = () => {
    onReorderStops(
      reorderedServices.map((service) => ({
        ...service,
        direction: service.direction as 1 | 2,
      })),
    )
    setHasChanges(false)
  }

  const handleStopClick = (service: typeof services[0] | undefined) => {
    if (!service) return
    fetch(`/api/services?stopId=${service.stop_id}`)
      .then((res) => res.json())
      .then((data: ServiceResponse[]) => {
        const routes = data.map((s) => s.route_number)
        const uniqueRoutes = Array.from(new Set(routes))

        const stopData: SelectedStop = {
          name: service.stop.stop_name,
          code: service.stop.stop_code,
          coordinates: [
            parseFloat(service.stop.latitude),
            parseFloat(service.stop.longitude),
          ],
          street_name: service.stop.street_name ?? undefined,
          routes: uniqueRoutes,
        }
        setSelectedStop(stopData)
      })
      .catch((error) => {
        console.error('Error fetching stop services:', error)
      })
  }

  return (
    <Card
      className={`absolute p-4 bg-background/95 backdrop-blur z-[1000] 
      w-[calc(100%-2rem)] sm:w-[400px] transition-all duration-300 ease-in-out
      ${
        isMinimized
          ? 'bottom-4 right-4 h-[56px]'
          : 'top-4 right-4 max-h-[calc(100dvh-2rem)]'
      } 
      flex flex-col overflow-hidden`}
    >
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="font-semibold">Editing Route {routeId}</h3>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              onClick={handleSaveChanges}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Save Changes
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0"
          >
            {isMinimized ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
          </Button>
        </div>
      </div>

      <div
        className={`flex flex-col transition-all duration-300 ease-in-out overflow-hidden
        ${isMinimized ? 'h-0' : 'h-full'}`}
      >
        {selectedStop && (
          <Button
            onClick={() => onAddStop(selectedStop)}
            className="w-full mb-4"
          >
            Add Selected Stop
          </Button>
        )}

        <div className="flex gap-2 mb-4">
          <Button
            variant={activeDirection === 1 ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setActiveDirection(1)}
          >
            Direction 1
          </Button>
          <Button
            variant={activeDirection === 2 ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setActiveDirection(2)}
          >
            Direction 2
          </Button>
        </div>

        <div className="overflow-y-auto min-h-0 flex-1">
          <div className="space-y-2">
            {currentDirectionServices.map((service, index) => (
              <div
                key={service.id}
                draggable
                onDragStart={(e) => handleDragStart(e, service, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`bg-muted p-2 rounded-md group hover:bg-muted/70 transition-colors cursor-move
                  ${draggedStop?.id === service.id ? 'opacity-40' : ''}
                  ${
                    dragOverIndex === index ? 'border-t-2 border-primary' : ''
                  }`}
                onClick={() => handleStopClick(service)}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs shrink-0 w-4">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {service.stop.stop_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {service.stop.stop_code}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// Add this new component for drawing direct connections between stops
function StopConnections({
  services,
  activeDirection,
}: {
  services: Service[]
  activeDirection: 1 | 2
}) {
  const map = useMap()

  useEffect(() => {
    if (services.length < 2) return

    // Sort services by sequence and split by direction
    const sortedServices = [...services].sort((a, b) => a.sequence - b.sequence)
    const directionServices = sortedServices.filter(
      (s) => s.direction === activeDirection,
    )
    const otherDirectionServices = sortedServices.filter(
      (s) => s.direction !== activeDirection,
    )

    // Get first and last stops for current direction
    const directionFirst = directionServices[0]
    const directionLast = directionServices[directionServices.length - 1]

    // Get first and last stops for other direction
    const otherFirst = otherDirectionServices[0]
    const otherLast = otherDirectionServices[otherDirectionServices.length - 1]

    // Check if any terminal stop is shared
    const isSharedFirstStop =
      activeDirection === 1
        ? directionFirst?.stop_id === otherLast?.stop_id
        : directionFirst?.stop_id === otherFirst?.stop_id
    const isSharedLastStop =
      activeDirection === 1
        ? directionLast?.stop_id === otherFirst?.stop_id
        : directionLast?.stop_id === otherLast?.stop_id

    // Create connections for active direction
    const connections = directionServices
      .slice(0, -1)
      .map((service, index) => {
        const nextService = directionServices[index + 1]
        if (!nextService) return null

        // Skip if it's a shared terminal stop
        if (
          (isSharedFirstStop && service.stop_id === directionFirst?.stop_id) ||
          (isSharedLastStop && nextService.stop_id === directionLast?.stop_id)
        ) {
          return null
        }

        return {
          from: [
            parseFloat(service.stop.latitude),
            parseFloat(service.stop.longitude),
          ] as L.LatLngExpression,
          to: [
            parseFloat(nextService.stop.latitude),
            parseFloat(nextService.stop.longitude),
          ] as L.LatLngExpression,
        }
      })
      .filter(Boolean)

    // Create polylines with arrows
    const decorators = connections
      .map((connection) => {
        if (!connection) return null
        const polyline = L.polyline(
          [connection.from, connection.to] as L.LatLngExpression[],
          {
            color: '#1d4ed8',
            weight: 3,
            opacity: 0.9,
          },
        )

        const decorator = L.polylineDecorator(polyline, {
          patterns: [
            {
              offset: '50%',
              repeat: 0,
              symbol: L.Symbol.arrowHead({
                pixelSize: 15,
                polygon: false,
                pathOptions: {
                  color: '#1d4ed8',
                  fillOpacity: 1,
                  weight: 2,
                },
              }),
            },
          ],
        })

        polyline.addTo(map)
        decorator.addTo(map)

        return { polyline, decorator }
      })
      .filter(Boolean)

    // Cleanup
    return () => {
      decorators.forEach((decorator) => {
        if (decorator) {
          decorator.polyline.remove()
          decorator.decorator.remove()
        }
      })
    }
  }, [services, map, activeDirection])

  return null
}

// Add this new component near the other helper components
function SelectedStopMarker({
  selectedStop,
  zoomLevel,
  isTouchDevice,
  getMarkerSize,
}: {
  selectedStop: SelectedStop | null
  zoomLevel: number
  isTouchDevice: boolean
  getMarkerSize: (zoom: number) => number
}) {
  if (!selectedStop) return null

  return (
    <Marker
      position={selectedStop.coordinates}
      icon={
        new L.Icon({
          iconUrl:
            'data:image/svg+xml;base64,' +
            btoa(`
              <svg width="${getMarkerSize(zoomLevel) * 1.2}" height="${
              getMarkerSize(zoomLevel) * 1.5
            }" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24c0-6.6-5.4-12-12-12Z" fill="#1d4ed8"/>
                <circle cx="12" cy="12" r="8" fill="white"/>
              </svg>
            `),
          iconSize: [
            getMarkerSize(zoomLevel) * 1.2,
            getMarkerSize(zoomLevel) * 1.5,
          ],
          iconAnchor: [
            getMarkerSize(zoomLevel) * 0.6,
            getMarkerSize(zoomLevel) * 1.5,
          ],
        })
      }
    >
      {!isTouchDevice && (
        <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
          <div className="flex flex-row items-center gap-2 pr-1">
            {selectedStop.code && (
              <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium bg-primary text-primary-foreground">
                {selectedStop.code}
              </span>
            )}
            <span className="text-sm font-medium">{selectedStop.name}</span>
          </div>
        </Tooltip>
      )}
    </Marker>
  )
}

export default function RouteEdit({
  routeId,
  services,
  shape,
}: RouteMapWrapperProps) {
  const { toast } = useToast()
  const { user } = useUser()
  const [stops, setStops] = useState<Stop[]>([])
  const [selectedStop, setSelectedStop] = useState<SelectedStop | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null)
  const [zoomLevel, setZoomLevel] = useState(13)
  const [selectedRoutes, setSelectedRoutes] = useState<
    Record<string, RouteDetails>
  >({})
  const [routeColors, setRouteColors] = useState<Record<string, string>>({})
  const [activeDirection, setActiveDirection] = useState<1 | 2>(1)
  const [reorderedStops, setReorderedStops] = useState(services)

  // Add stops data fetching
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const response = await fetch('/api/stops')
        const data = (await response.json()) as Stop[]
        setStops(data)
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
      .then((data: ServiceResponse[]) => {
        const routes = data.map((s) => s.route_number)
        const uniqueRoutes = Array.from(new Set(routes))

        const stopData: SelectedStop = {
          name: service.stop.stop_name,
          code: service.stop.stop_code,
          coordinates: [
            parseFloat(service.stop.latitude),
            parseFloat(service.stop.longitude),
          ],
          street_name: service.stop.street_name ?? undefined,
          routes: uniqueRoutes,
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

  // Helper function to check if a stop is within current bounds
  const isInBounds = (stop: Stop) => {
    if (!bounds) return false
    const lat = parseFloat(stop.latitude)
    const lng = parseFloat(stop.longitude)
    return bounds.contains([lat, lng])
  }

  // Function to calculate marker size based on zoom level
  const getMarkerSize = (zoom: number) => {
    const baseSize = 10
    const scaleFactor = 1 + (zoom - 13) * 0.2
    return baseSize * scaleFactor
  }
  //   console.log('Direction 1', shape.direction1)
  //   console.log('Direction 2', shape.direction2)

  //   console.log('Zoom Level', zoomLevel)

  const handleNonRouteStopClick = (stop: Stop) => {
    // Find all services for this stop from the API
    fetch(`/api/services?stopId=${stop.stop_id}`)
      .then((res) => res.json())
      .then((data: ServiceResponse[]) => {
        const routes = data.map((s) => s.route_number)
        const uniqueRoutes = Array.from(new Set(routes))

        setSelectedStop({
          name: stop.stop_name,
          code: stop.stop_code,
          coordinates: [parseFloat(stop.latitude), parseFloat(stop.longitude)],
          street_name: stop.street_name ?? undefined,
          routes: uniqueRoutes,
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
    // Here you would typically make an API call to add the stop to the route
    console.log('Adding stop:', stop)
    // TODO: Implement API call
  }

  const handleReorderStops = async (stops: RouteStop[]) => {
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
          <BoundsHandler setBounds={setBounds} />
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

          {/* Add all stops in view */}
          {stops
            .filter(
              (stop) =>
                isInBounds(stop) &&
                !isRouteStop(stop.stop_id) &&
                !Object.values(selectedRoutes).some((route) =>
                  route.services.some(
                    (service) => service.stop_id === stop.stop_id,
                  ),
                ) &&
                zoomLevel >= 13,
            )
            .map((stop) => (
              <Marker
                key={stop.id}
                position={[
                  parseFloat(stop.latitude),
                  parseFloat(stop.longitude),
                ]}
                eventHandlers={{
                  click: () => handleNonRouteStopClick(stop),
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
                    <circle cx="10" cy="10" r="8" fill="white" stroke="#9ca3af" stroke-width="4"/>
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
                {selectedStop.code && (
                  <span className="shrink-0 px-2 py-0.5 bg-primary text-primary-foreground text-sm font-medium rounded-md">
                    {selectedStop.code}
                  </span>
                )}
                <div className="flex flex-col min-w-0">
                  <h3 className="text-lg text-foreground font-semibold truncate">
                    {selectedStop.name}
                  </h3>
                  {selectedStop.street_name && (
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedStop.street_name}
                    </p>
                  )}
                </div>
              </div>

              {selectedStop.routes.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {selectedStop.routes.map((route) => (
                      <button
                        key={route}
                        onClick={() => handleRouteClick(route)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs 
                          ${
                            selectedRoutes[route]
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          } 
                          hover:bg-secondary/80 transition-colors cursor-pointer 
                          active:ring-2 active:ring-ring active:ring-offset-2 active:ring-offset-background`}
                      >
                        {route}
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
                                  <button
                                    onClick={() => {
                                      const { ...rest } = selectedRoutes
                                      setSelectedRoutes(rest)
                                    }}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    Remove
                                  </button>
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
