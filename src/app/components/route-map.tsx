'use client'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Card } from '@/app/components/ui/card'
import servicesData from '@/data/from_db/kl-transit_service.json'
import type { RouteMapProps, SelectedStop } from '@/types/routes'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip'
import { Link } from '@/i8n/routing'

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
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [hoverInfo, setHoverInfo] = useState<{
    x: number
    y: number
    name: string
    code?: string
  } | null>(null)

  // Add touch detection on mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window)
  }, [])

  // Memoize the GeoJSON data to prevent unnecessary recalculations
  const stopsGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: services.map((service) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
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
              type: 'Feature' as const,
              properties: {},
              geometry: {
                type: 'LineString' as const,
                coordinates: shape.direction1.coordinates,
              },
            }
          : null,
      direction2:
        shape.direction2.coordinates.length > 0
          ? {
              type: 'Feature' as const,
              properties: {},
              geometry: {
                type: 'LineString' as const,
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

    // Hide navigation controls on small screens
    const navControl = document.querySelector('.mapboxgl-ctrl-top-right')
    if (navControl) {
      navControl.classList.add('hidden', 'sm:block')
    }

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

      // Update click handler to format coordinates correctly
      map.on(
        'click',
        'stops',
        (
          e: mapboxgl.MapMouseEvent & {
            features?: mapboxgl.GeoJSONFeature[]
          },
        ) => {
          // Prevent default touch behavior
          e.preventDefault?.()

          if (e.features && e.features.length > 0) {
            const feature = e.features[0]
            const stopId = feature?.properties?.stop_id as string
            const coordinates = (feature?.geometry as GeoJSON.Point).coordinates

            // Adjust the center point slightly lower to account for the info box
            map.flyTo({
              center: [
                coordinates[0]!,
                coordinates[1]! - 0.00008, // Shift slightly south to account for info box
              ] as [number, number],
              zoom: 15,
              duration: 1000,
              padding: { top: 100, bottom: 50, left: 50, right: 50 }, // Add padding to top for info box
            })

            // Update selection ring using stop_id
            map.setFilter('stops-selected', ['==', ['get', 'stop_id'], stopId])
            map.setPaintProperty('stops-selected', 'circle-opacity', 1)

            // Get routes for this stop
            const routes = servicesData
              .filter((service) => service.stop_id === stopId)
              .map((service) => service.route_number)
            const uniqueRoutes = Array.from(new Set(routes))

            // Set selected stop info with correctly formatted coordinates
            setSelectedStop({
              id: feature?.properties?.stop_id as string,
              stop_id: feature?.properties?.stop_id as string,
              stop_name: feature?.properties?.name as string,
              stop_code: feature?.properties?.code as string,
              latitude: (feature?.geometry as GeoJSON.Point).coordinates[1]!.toString(),
              longitude: (feature?.geometry as GeoJSON.Point).coordinates[0]!.toString(),
              coordinates: [
                (feature?.geometry as GeoJSON.Point).coordinates[1]!,
                (feature?.geometry as GeoJSON.Point).coordinates[0]!,
              ] as [number, number],
              street_name: feature?.properties?.street_name as string | null,
              route_number: uniqueRoutes,
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

      // Only add hover handlers if not a touch device
      if (!isTouchDevice) {
        map.on('mouseenter', 'stops', (e) => {
          map.getCanvas().style.cursor = 'pointer'
          if (e.features?.[0]) {
            const feature = e.features[0]
            setHoverInfo({
              x: e.point.x,
              y: e.point.y,
              name: feature.properties?.name as string,
              code: feature.properties?.code as string | undefined,
            })
          }
        })

        map.on('mouseleave', 'stops', () => {
          map.getCanvas().style.cursor = ''
          setHoverInfo(null)
        })

        map.on('mousemove', 'stops', (e) => {
          if (e.features?.[0]) {
            const feature = e.features[0]
            setHoverInfo({
              x: e.point.x,
              y: e.point.y - 10,
              name: feature.properties?.name as string,
              code: feature.properties?.code as string | undefined,
            })
          }
        })
      }

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
  }, [services, stopsGeoJSON, routeShapes, isTouchDevice])

  return (
    <div className="relative">
      <div ref={mapContainer} className="w-full h-96" />
      {selectedStop && (
        <Card className="absolute top-2 left-2 p-4 bg-background/95 backdrop-blur sm:w-fit sm:max-w-sm w-[calc(100%-1rem)]">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {selectedStop.stop_code && (
                  <span className="shrink-0 px-2 py-0.5 bg-primary text-primary-foreground text-sm font-medium rounded-md">
                    {selectedStop.stop_code}
                  </span>
                )}
                <div className="flex flex-col">
                  <h3 className="text-lg text-foreground font-semibold">
                    {selectedStop.stop_name}
                  </h3>
                  {selectedStop.street_name && (
                    <p className="text-sm text-muted-foreground">
                      {selectedStop.street_name}
                    </p>
                  )}
                </div>
              </div>

              {selectedStop.route_number.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {selectedStop.route_number.map((route: string) => (
                      <Link
                        key={route}
                        href={`/routes/${route}`}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer active:ring-2 active:ring-ring active:ring-offset-2 active:ring-offset-background"
                      >
                        {route}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleCloseSelectedStop}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </Card>
      )}

      {/* Only show tooltip on non-touch devices */}
      {!isTouchDevice && hoverInfo && (
        <TooltipProvider>
          <Tooltip open={true}>
            <TooltipTrigger asChild>
              <div
                style={{
                  position: 'absolute',
                  left: hoverInfo.x,
                  top: hoverInfo.y,
                  width: '1px',
                  height: '1px',
                }}
              />
            </TooltipTrigger>
            <TooltipContent
              className="bg-background/95 backdrop-blur"
              side="top"
              sideOffset={5}
            >
              <div className="flex flex-row items-center gap-2 pr-1">
                {hoverInfo.code && (
                  <div className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center rounded-md bg-primary/90 text-primary-foreground px-2.5 py-0.5 text-sm font-medium">
                      {hoverInfo.code}
                    </span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground font-medium">
                  {hoverInfo.name}
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
