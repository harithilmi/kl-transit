'use client'

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-polylinedecorator'
import { useEffect, useRef, useState } from 'react'
import type { FC } from 'react'
import L from 'leaflet'
import type { Service, RouteShape } from '../types/routes'
import { Card } from '~/components/ui/card'
import servicesData from '~/data/from_db/kl-transit_service.json'

export interface MapComponentProps {
  services: Service[]
  shape: {
    direction1: RouteShape
    direction2: RouteShape
  }
}

interface SelectedStop {
  id: string
  name: string
  code: string
  coordinates: [number, number]
  street_name?: string
  routes: string[]
}

// Add this helper function at the top level
function reverseCoordinates(coords: [number, number][]): [number, number][] {
  return coords.map(([lng, lat]) => [lat, lng])
}

// Component to handle map bounds
const MapBoundsHandler: FC<{
  services: Service[]
  shape: MapComponentProps['shape']
}> = ({ services, shape }) => {
  const map = useMap()

  useEffect(() => {
    if (!services || !shape) return

    // Wait for the map to be ready
    const handleMapReady = () => {
      const bounds = new L.LatLngBounds([])

      // Add stops to bounds
      services.forEach((service) => {
        const lat = parseFloat(service.stop.latitude)
        const lng = parseFloat(service.stop.longitude)
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend([lat, lng])
        }
      })

      // Add route coordinates to bounds
      if (shape?.direction1?.coordinates?.length > 0) {
        shape.direction1.coordinates.forEach(([lng, lat]) => {
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend([lat, lng])
          }
        })
      }

      if (shape?.direction2?.coordinates?.length > 0) {
        shape.direction2.coordinates.forEach(([lng, lat]) => {
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend([lat, lng])
          }
        })
      }

      // Fit bounds with padding if bounds exist and are valid
      if (bounds.getNorthEast() && bounds.getSouthWest()) {
        setTimeout(() => {
          map.invalidateSize()
          map.fitBounds(bounds, {
            padding: [50, 50],
            duration: 0,
          })
        }, 100)
      }
    }

    map.whenReady(handleMapReady)

    return () => {
      map.off('ready', handleMapReady)
    }
  }, [map, services, shape])

  return null
}

const MapComponent: FC<MapComponentProps> = ({ services, shape }) => {
  const [selectedStop, setSelectedStop] = useState<SelectedStop | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)

  // Function to calculate center from services and shape
  useEffect(() => {
    if (!services?.length && !shape) {
      setMapCenter([3.139, 101.6869]) // Default to KL
      return
    }

    let bounds: L.LatLngBounds | null = null

    // Add stops to bounds
    if (services?.length) {
      services.forEach((service) => {
        const lat = parseFloat(service.stop.latitude)
        const lng = parseFloat(service.stop.longitude)
        if (!isNaN(lat) && !isNaN(lng)) {
          if (!bounds) {
            bounds = new L.LatLngBounds([lat, lng], [lat, lng])
          } else {
            bounds.extend([lat, lng])
          }
        }
      })
    }

    // Add route coordinates to bounds
    if (shape?.direction1?.coordinates?.length) {
      shape.direction1.coordinates.forEach((coord) => {
        if (Array.isArray(coord) && coord.length === 2) {
          const [lng, lat] = coord
          if (!isNaN(lat) && !isNaN(lng)) {
            if (!bounds) {
              bounds = new L.LatLngBounds([lat, lng], [lat, lng])
            } else {
              bounds.extend([lat, lng])
            }
          }
        }
      })
    }

    if (shape?.direction2?.coordinates?.length) {
      shape.direction2.coordinates.forEach((coord) => {
        if (Array.isArray(coord) && coord.length === 2) {
          const [lng, lat] = coord
          if (!isNaN(lat) && !isNaN(lng)) {
            if (!bounds) {
              bounds = new L.LatLngBounds([lat, lng], [lat, lng])
            } else {
              bounds.extend([lat, lng])
            }
          }
        }
      })
    }

    if (bounds?.isValid()) {
      const center = bounds.getCenter()
      setMapCenter([center.lat, center.lng])
    } else {
      setMapCenter([3.139, 101.6869]) // Default to KL if no valid bounds
    }
  }, [services, shape])

  // Function to handle stop click
  const handleStopClick = (service: Service) => {
    // Get all routes for this stop from servicesData
    const routes = servicesData
      .filter((s) => s.stop_id === service.stop_id)
      .map((s) => s.route_number)
    const uniqueRoutes = Array.from(new Set(routes))

    setSelectedStop({
      id: service.stop.stop_id,
      name: service.stop.stop_name,
      code: service.stop.stop_code,
      coordinates: [
        parseFloat(service.stop.latitude),
        parseFloat(service.stop.longitude),
      ],
      street_name: service.stop.street_name ?? undefined,
      routes: uniqueRoutes,
    })

    mapRef.current?.setView(
      [parseFloat(service.stop.latitude), parseFloat(service.stop.longitude)],
      15,
    )
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Sort services by sequence and direction
  const sortedServices = services
    ? [...services].sort((a, b) => a.sequence - b.sequence)
    : []
  const direction1Services = sortedServices.filter((s) => s.direction === 1)
  const direction2Services = sortedServices.filter((s) => s.direction === 2)

  // Add effect for polyline decorators
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current
    
    // Function to add decorators
    const addDecorators = () => {
      // Clear existing decorators
      map.eachLayer((layer: L.Layer) => {
        if ((layer as any)._decorator) {
          map.removeLayer(layer)
        }
      })

      // Add decorators for direction 1
      if (shape?.direction1?.coordinates?.length > 0) {
        const decorator1 = L.polylineDecorator(
          reverseCoordinates(shape.direction1.coordinates),
          {
            patterns: [
              {
                offset: '25%',
                repeat: 50,
                symbol: L.Symbol.arrowHead({
                  pixelSize: 12,
                  polygon: false,
                  pathOptions: {
                    stroke: true,
                    color: '#4f46e5',
                    weight: 2,
                  },
                }),
              },
            ],
          },
        ).addTo(map)
      }

      // Add decorators for direction 2
      if (shape?.direction2?.coordinates?.length > 0) {
        const decorator2 = L.polylineDecorator(
          reverseCoordinates(shape.direction2.coordinates),
          {
            patterns: [
              {
                offset: '25%',
                repeat: 50,
                symbol: L.Symbol.arrowHead({
                  pixelSize: 12,
                  polygon: false,
                  pathOptions: {
                    stroke: true,
                    color: '#818cf8',
                    weight: 2,
                  },
                }),
              },
            ],
          },
        ).addTo(map)
      }
    }

    // Add decorators immediately
    addDecorators()

    // Also add decorators when the map becomes ready
    map.whenReady(addDecorators)

    return () => {
      map.off('ready', addDecorators)
    }
  }, [shape, mapRef.current])

  // Only render the map when we have a center
  if (!mapCenter) {
    return <div>Loading map...</div>
  }

  return (
    <div className="relative">
      <MapContainer
        ref={mapRef}
        style={{ height: '400px', width: '100%' }}
        center={mapCenter}
        zoom={12}
        whenReady={(e: L.LeafletEvent) => {
          mapRef.current = e.target
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {/* Bounds handler */}
        <MapBoundsHandler services={services} shape={shape} />
        {/* Direction 1 Route */}
        {shape?.direction1?.coordinates?.length > 0 && (
          <Polyline
            positions={reverseCoordinates(shape.direction1.coordinates)}
            pathOptions={{
              color: '#4f46e5',
              weight: 4,
              opacity: 0.8,
            }}
          />
        )}
        {/* Direction 2 Route */}
        {shape?.direction2?.coordinates?.length > 0 && (
          <Polyline
            positions={reverseCoordinates(shape.direction2.coordinates)}
            pathOptions={{
              color: '#818cf8',
              weight: 4,
              opacity: 0.8,
            }}
          />
        )}
        {/* Direction 1 Stops */}
        {direction1Services.map((service) => (
          <CircleMarker
            key={`${service.id}-${service.stop_id}-${service.sequence}`}
            center={[
              parseFloat(service.stop.latitude),
              parseFloat(service.stop.longitude),
            ]}
            pathOptions={{
              color: '#4f46e5',
              fillColor: '#ffffff',
              fillOpacity: 1,
              weight: selectedStop?.id === service.stop.stop_id ? 3 : 2,
            }}
            radius={selectedStop?.id === service.stop.stop_id ? 6 : 4}
            eventHandlers={{
              click: () => handleStopClick(service),
            }}
          >
            {selectedStop?.id === service.stop.stop_id && (
              <CircleMarker
                center={[
                  parseFloat(service.stop.latitude),
                  parseFloat(service.stop.longitude),
                ]}
                pathOptions={{
                  color: '#4f46e5',
                  fillColor: 'transparent',
                  weight: 3,
                  opacity: 1,
                }}
                radius={12}
              />
            )}
          </CircleMarker>
        ))}
        {/* Direction 2 Stops */}
        {direction2Services.map((service) => (
          <CircleMarker
            key={`${service.id}-${service.stop_id}-${service.sequence}`}
            center={[
              parseFloat(service.stop.latitude),
              parseFloat(service.stop.longitude),
            ]}
            pathOptions={{
              color: '#818cf8',
              fillColor: '#ffffff',
              fillOpacity: 1,
              weight: selectedStop?.id === service.stop.stop_id ? 3 : 2,
            }}
            radius={selectedStop?.id === service.stop.stop_id ? 6 : 4}
            eventHandlers={{
              click: () => handleStopClick(service),
            }}
          >
            {selectedStop?.id === service.stop.stop_id && (
              <CircleMarker
                center={[
                  parseFloat(service.stop.latitude),
                  parseFloat(service.stop.longitude),
                ]}
                pathOptions={{
                  color: '#818cf8',
                  fillColor: 'transparent',
                  weight: 3,
                  opacity: 1,
                }}
                radius={12}
              />
            )}
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Selected Stop Info Card */}
      {selectedStop && (
        <Card className="absolute top-4 left-4 p-4 bg-white/95 backdrop-blur w-fit max-w-sm z-[400]">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {selectedStop.code && (
                  <span className="shrink-0 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-sm rounded-md">
                    {selectedStop.code}
                  </span>
                )}
                <div className="flex flex-col">
                  <h3 className="text-lg text-black font-semibold">
                    {selectedStop.name}
                  </h3>
                  {selectedStop.street_name && (
                    <p className="text-sm text-black/70">
                      {selectedStop.street_name}
                    </p>
                  )}
                </div>
              </div>

              {selectedStop.routes.length > 0 && (
                <div>
                  <p className="text-sm text-black/70 font-medium mb-1">
                    Routes:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStop.routes.map((route) => (
                      <a
                        key={route}
                        href={`/routes/${route}`}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors cursor-pointer"
                      >
                        {route}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedStop(null)
                if (mapRef.current) {
                  const bounds = mapRef.current.getBounds()
                  mapRef.current.fitBounds(bounds, {
                    padding: [50, 50],
                    duration: 1000,
                  })
                }
              }}
              className="text-black/50 hover:text-black/70"
            >
              ✕
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default MapComponent
