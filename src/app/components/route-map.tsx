'use client'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Card } from '~/components/ui/card'
import servicesData from '~/data/from_db/kl-transit_service.json'
import type { RouteMapProps } from '../types/routes'

interface SelectedStop {
  name: string
  code: string
  coordinates: [number, number]
  street_name?: string
  routes: string[]
}

// Initialize mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

// Cache the arrow images to avoid recreating them
const arrowImageCache = new Map<string, string>()
function createArrowImage(color: string) {
  if (arrowImageCache.has(color)) {
    return arrowImageCache.get(color)!
  }

  const svg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 19V5M12 5L6 11M12 5L18 11" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 19V5M12 5L6 11M12 5L18 11" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
  const dataUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
  arrowImageCache.set(color, dataUrl)
  return dataUrl
}

// Cache map instances to avoid memory leaks
const mapInstanceCache = new Map<string, mapboxgl.Map>()

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

  // Memoize the GeoJSON data to prevent unnecessary recalculations
  const stopsGeoJSON = useMemo(
    () => ({
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
    }),
    [services],
  )

  // Memoize route shapes to prevent unnecessary recalculations
  const routeShapes = useMemo(
    () => ({
      direction1:
        shape.direction1.coordinates.length > 0
          ? {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: shape.direction1.coordinates,
              },
            }
          : null,
      direction2:
        shape.direction2.coordinates.length > 0
          ? {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: shape.direction2.coordinates,
              },
            }
          : null,
    }),
    [shape],
  )

  // Update the close function to use the refs
  const handleCloseSelectedStop = () => {
    setSelectedStop(null)
    if (mapInstance.current) {
      const map = mapInstance.current
      map.setFilter('stops-selected', ['==', ['get', 'stop_id'], ''])
      map.setPaintProperty('stops-selected', 'circle-opacity', 0)

      //   // Create new bounds
      //   const bounds = new mapboxgl.LngLatBounds()

      //   // Extend bounds with stop coordinates
      //   services.forEach((service) => {
      //     bounds.extend([
      //       parseFloat(service.stop.longitude),
      //       parseFloat(service.stop.latitude),
      //     ])
      //   })

      //   // Fit bounds after all elements are added
      //   if (bounds.getNorthEast() && bounds.getSouthWest()) {
      //     map.fitBounds(bounds, {
      //       padding: { top: 50, bottom: 50, left: 50, right: 50 },
      //       duration: 1000,
      //     })
      //   }
    }
  }

  useEffect(() => {
    if (!mapContainer.current) return

    // Use cached map instance if available
    const cacheKey = `${services[0]?.route_number ?? 'default'}`
    let map = mapInstanceCache.get(cacheKey)

    if (!map) {
      map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [101.6958, 3.1466],
        zoom: 11,
        maxZoom: 18,
      })

      // Add error handling
      map.on('error', (e) => {
        console.error('Mapbox error:', e.error)
      })

      mapInstanceCache.set(cacheKey, map)
    }

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
      // Add route lines and arrows for direction 1
      if (routeShapes.direction1) {
        map.addSource('route-direction1', {
          type: 'geojson',
          data: routeShapes.direction1,
        })

        // Add the route line
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

        // Create and load arrow image for direction 1
        const arrowImage1 = new Image()
        arrowImage1.src = createArrowImage('#4f46e5')
        arrowImage1.onload = () => {
          map.addImage('arrow-direction1', arrowImage1)

          map.addLayer({
            id: 'route-direction1-arrows',
            type: 'symbol',
            source: 'route-direction1',
            layout: {
              'symbol-placement': 'line',
              'symbol-spacing': 80,
              'icon-image': 'arrow-direction1',
              'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10,
                0.5,
                15,
                1.0,
              ],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-padding': 0,
              'icon-rotation-alignment': 'map',
              'icon-pitch-alignment': 'viewport',
              'icon-rotate': 90,
              'icon-offset': [-10, 0],
            },
            paint: {
              'icon-opacity': 0.8,
            },
          })
        }

        routeShapes.direction1.geometry.coordinates.forEach((coord) =>
          bounds.extend(coord),
        )
      }

      // Add route lines and arrows for direction 2
      if (routeShapes.direction2) {
        map.addSource('route-direction2', {
          type: 'geojson',
          data: routeShapes.direction2,
        })

        // Add the route line
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
            'line-opacity': 1,
          },
        })

        // Create and load arrow image for direction 2
        const arrowImage2 = new Image()
        arrowImage2.src = createArrowImage('#818cf8')
        arrowImage2.onload = () => {
          map.addImage('arrow-direction2', arrowImage2)

          map.addLayer({
            id: 'route-direction2-arrows',
            type: 'symbol',
            source: 'route-direction2',
            layout: {
              'symbol-placement': 'line',
              'symbol-spacing': 80,
              'icon-image': 'arrow-direction2',
              'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10,
                0.5,
                15,
                1.0,
              ],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-padding': 0,
              'icon-rotation-alignment': 'map',
              'icon-pitch-alignment': 'viewport',
              'icon-rotate': 90,
              'icon-offset': [-10, 0],
            },
            paint: {
              'icon-opacity': 0.8,
            },
          })
        }

        routeShapes.direction2.geometry.coordinates.forEach((coord) =>
          bounds.extend(coord),
        )
      }
      // Add stops as a source
      map.addSource('stops', {
        type: 'geojson',
        data: stopsGeoJSON,
      })

      // Add stops layer
      map.addLayer({
        id: 'stops',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            2, // When zoomed out (zoom level 10 or less), radius is 2px
            13,
            4, // When zoomed in (zoom level 13 or more), radius is 4px
          ],
          'circle-color': '#ffffff',
          'circle-stroke-color': '#1d4ed8',
          'circle-stroke-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            0.5, // Thinner stroke when zoomed out
            13,
            1.5, // Normal stroke when zoomed in
          ],
        },
      })

      // Add selection ring layer
      map.addLayer({
        id: 'stops-selected',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            5, // Smaller selection ring when zoomed out
            13,
            10, // Normal selection ring when zoomed in
          ],
          'circle-color': 'transparent',
          'circle-stroke-color': '#1d4ed8',
          'circle-stroke-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            1, // Thinner stroke when zoomed out
            13,
            2, // Normal stroke when zoomed in
          ],
          'circle-opacity': 0,
        },
        filter: ['==', ['get', 'stop_id'], ''],
      })

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

      // Update background click handler to use new function
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['stops'],
        })
        if (features.length === 0) {
          handleCloseSelectedStop()

          // // Extend bounds with stop coordinates
          // services.forEach((service) => {
          //   bounds.extend([
          //     parseFloat(service.stop.longitude),
          //     parseFloat(service.stop.latitude),
          //   ])
          // })

          // // Fit bounds after all elements are added
          // if (bounds.getNorthEast() && bounds.getSouthWest()) {
          //   map.fitBounds(bounds, {
          //     padding: { top: 50, bottom: 50, left: 50, right: 50 },
          //     duration: 1000, // Instant fit without animation
          //   })
          // }
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
      // Clean up map instance and remove from cache
      if (map) {
        // Remove specific layers and sources
        if (map.getLayer('route-direction1-arrows'))
          map.removeLayer('route-direction1-arrows')
        if (map.getLayer('route-direction2-arrows'))
          map.removeLayer('route-direction2-arrows')
        if (map.getLayer('route-direction1'))
          map.removeLayer('route-direction1')
        if (map.getLayer('route-direction2'))
          map.removeLayer('route-direction2')
        if (map.getSource('route-direction1'))
          map.removeSource('route-direction1')
        if (map.getSource('route-direction2'))
          map.removeSource('route-direction2')

        map.remove()
        mapInstanceCache.delete(cacheKey)
      }
    }
  }, [services, stopsGeoJSON, routeShapes])

  return (
    <div className="relative">
      <div ref={mapContainer} className="w-full h-96" />
      {selectedStop && (
        <Card className="absolute top-2 left-2 p-4 bg-white/95 backdrop-blur w-fit max-w-sm">
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
              onClick={handleCloseSelectedStop}
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
