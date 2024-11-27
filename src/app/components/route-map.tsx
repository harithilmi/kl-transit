'use client'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef, useState } from 'react'
import type { Service, RouteShape } from '../types/routes'
import { Card } from '~/components/ui/card'
import servicesData from '~/data/from_db/kl-transit_service.json'

interface RouteMapProps {
  services: Service[]
  shape: {
    direction1: RouteShape
    direction2: RouteShape
  }
}

interface SelectedStop {
  name: string
  code: string
  coordinates: [number, number]
  street_name?: string
  routes: string[]
}

// Initialize mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

export function RouteMap({
  services = [],
  shape = {
    direction1: {
      route_number: '',
      direction: 1,
      coordinates: [],
    },
    direction2: {
      route_number: '',
      direction: 2,
      coordinates: [],
    },
  },
}: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<mapboxgl.Map | null>(null)
  const [selectedStop, setSelectedStop] = useState<SelectedStop | null>(null)

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [101.6958, 3.1466],
      zoom: 11,
      maxZoom: 18,
    })

    mapInstance.current = map

    // Add navigation controls
    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: false,
      }),
      'top-right',
    )

    // Create bounds object
    const bounds = new mapboxgl.LngLatBounds()

    // Wait for style to load before adding sources and layers
    map.once('style.load', () => {
      // Add stops as a source
      map.addSource('stops', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: services.map((service) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [
                parseFloat(service.stop.longitude),
                parseFloat(service.stop.latitude),
              ],
            },
            properties: {
              name: service.stop.stop_name,
              code: service.stop.stop_code,
              street_name: service.stop.street_name,
              stop_id: service.stop_id,
            },
          })),
        },
      })

      // Add stops layer
      map.addLayer({
        id: 'stops',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': 4,
          'circle-color': '#ffffff',
          'circle-stroke-color': '#1d4ed8',
          'circle-stroke-width': 1.5,
        },
      })

      // Add selection ring layer
      map.addLayer({
        id: 'stops-selected',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': 10,
          'circle-color': 'transparent',
          'circle-stroke-color': '#1d4ed8',
          'circle-stroke-width': 2,
          'circle-opacity': 0,
        },
        filter: ['==', ['get', 'stop_id'], ''],
      })

      // Add route lines
      if (shape?.direction1?.coordinates?.length > 0) {
        map.addSource('route-direction1', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: shape.direction1.coordinates,
            },
          },
        })

        map.addLayer({
          id: 'route-direction1',
          type: 'line',
          source: 'route-direction1',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#4f46e5',
            'line-width': 4,
            'line-opacity': 0.8,
          },
        })

        shape.direction1.coordinates.forEach((coord) => bounds.extend(coord))
      }

      if (shape?.direction2?.coordinates?.length > 0) {
        map.addSource('route-direction2', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: shape.direction2.coordinates,
            },
          },
        })

        map.addLayer({
          id: 'route-direction2',
          type: 'line',
          source: 'route-direction2',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#818cf8',
            'line-width': 4,
            'line-opacity': 0.8,
          },
        })

        shape.direction2.coordinates.forEach((coord) => bounds.extend(coord))
      }

      // Update click handler to show selection ring
      map.on(
        'click',
        'stops',
        (
          e: mapboxgl.MapMouseEvent & {
            features?: mapboxgl.GeoJSONFeature[]
          },
        ) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0]
            const stopId = feature?.properties?.stop_id as string
            const coordinates = (feature?.geometry as GeoJSON.Point).coordinates

            // Fly to the clicked stop
            map.flyTo({
              center: [coordinates[0]!, coordinates[1]!] as [number, number],
              zoom: 15,
              duration: 1000,
              padding: { left: 320 },
            })

            // Update selection ring using stop_id
            map.setFilter('stops-selected', ['==', ['get', 'stop_id'], stopId])
            map.setPaintProperty('stops-selected', 'circle-opacity', 1)

            // Get routes for this stop
            const routes = servicesData
              .filter((service) => service.stop_id === stopId)
              .map((service) => service.route_number)
            const uniqueRoutes = Array.from(new Set(routes))

            // Set selected stop info
            setSelectedStop({
              name: feature?.properties?.name as string,
              code: feature?.properties?.code as string,
              coordinates: [
                (feature?.geometry as GeoJSON.Point).coordinates[0]!,
                (feature?.geometry as GeoJSON.Point).coordinates[1]!,
              ],
              street_name: feature?.properties?.street_name as
                | string
                | undefined,
              routes: uniqueRoutes,
            })
          }
        },
      )

      // Update background click handler
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['stops'],
        })
        if (features.length === 0) {
          setSelectedStop(null)
          map.setFilter('stops-selected', ['==', ['get', 'stop_id'], ''])
          map.setPaintProperty('stops-selected', 'circle-opacity', 0)
          // Zoom out
          map.flyTo({
            zoom: 11,
            duration: 1000,
          })
        }
      })

      // Add cursor style change
      map.on('mouseenter', 'stops', () => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'stops', () => {
        map.getCanvas().style.cursor = ''
      })

      // Extend bounds with stop coordinates
      services.forEach((service) => {
        bounds.extend([
          parseFloat(service.stop.longitude),
          parseFloat(service.stop.latitude),
        ])
      })

      // Fit bounds after all elements are added
      if (bounds.getNorthEast() && bounds.getSouthWest()) {
        map.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 0, // Instant fit without animation
        })
      }

      // Clear any selected stop on init
      map.setFilter('stops-selected', ['==', ['get', 'stop_id'], ''])
      map.setPaintProperty('stops-selected', 'circle-opacity', 0)
    })

    // Add zoom handler
    map.on('zoom', () => {
      const zoom = map.getZoom()
      document.querySelectorAll('.custom-marker').forEach((marker) => {
        marker.classList.remove('zoom-sm', 'zoom-md', 'zoom-lg')
        if (zoom >= 15) {
          marker.classList.add('zoom-lg')
        } else if (zoom >= 13) {
          marker.classList.add('zoom-md')
        } else {
          marker.classList.add('zoom-sm')
        }
      })
    })

    return () => {
      map.remove()
    }
  }, [services, shape])

  return (
    <div className="relative">
      <div ref={mapContainer} className="w-full h-96" />
      {selectedStop && (
        <Card className="absolute top-4 left-4 p-4 bg-white/95 backdrop-blur w-fit max-w-sm">
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
                mapInstance.current?.setFilter('stops-selected', [
                  '==',
                  ['get', 'stop_id'],
                  '',
                ])
                mapInstance.current?.setPaintProperty(
                  'stops-selected',
                  'circle-opacity',
                  0,
                )
                mapInstance.current?.flyTo({
                  zoom: 11,
                  duration: 1000,
                })
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
