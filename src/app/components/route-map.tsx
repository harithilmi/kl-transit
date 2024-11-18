'use client'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { RouteStopWithData } from '../types/routes'
import Link from 'next/link'

// Initialize mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

interface Route {
  route_number: string
  route_name: string
  service_id: number
}

interface SelectedStop {
  name: string
  code: string
  sequence: number
  streetName?: string
  latitude: number
  longitude: number
  routes: Route[]
}

interface RouteMapProps {
  services: RouteStopWithData[]
  routeShapes?: {
    routeNumber: string
    direction: number
    coordinates: [number, number][]
  }[]
}

// Add type for gesture event
interface CooperativeGestureEvent {
  type: 'scroll' | 'touch'
}

function getUniqueRoutes(routes: Route[]): Route[] {
  const seen = new Set()
  return routes.filter((route) => {
    if (seen.has(route.route_number)) return false
    seen.add(route.route_number)
    return true
  })
}

function getRoutesForStop(
  service: RouteStopWithData & {
    stop: NonNullable<RouteStopWithData['stop']>
  },
): Route[] {
  return (service.stop.connecting_routes ?? []).map(
    (route: {
      route_number: string
      route_name: string
      service_id: number
    }) => ({
      route_number: route.route_number,
      route_name: route.route_name,
      service_id: route.service_id,
    }),
  )
}

function updateMarkerSize(marker: HTMLElement, zoom: number) {
  marker.classList.remove('zoom-sm', 'zoom-md', 'zoom-lg')
  if (zoom >= 15) {
    marker.classList.add('zoom-lg')
  } else if (zoom >= 13) {
    marker.classList.add('zoom-md')
  } else {
    marker.classList.add('zoom-sm')
  }
}

export function RouteMap({ services, routeShapes }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [selectedStop, setSelectedStop] = useState<SelectedStop | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const handleStopSelect = useCallback(
    (stop: SelectedStop) => {
      setIsVisible(false)
      setTimeout(() => {
        setSelectedStop(stop)
        setIsVisible(true)
      }, 200)
    },
    [],
  )

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Create style element first
    const styleElement = document.createElement('style')

    // Filter valid services first
    const validServices = services.filter(
      (
        service,
      ): service is RouteStopWithData & {
        stop: NonNullable<RouteStopWithData['stop']>
      } => service.stop !== undefined,
    )

    if (validServices.length === 0) return

    // Get coordinates for all stops
    const coordinates = validServices.map(
      (service) =>
        [service.stop.longitude, service.stop.latitude] as [number, number],
    )

    // Calculate bounds before map initialization
    const bounds = new mapboxgl.LngLatBounds()
    coordinates.forEach((coord) => bounds.extend(coord))

    // Create map instance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      bounds: bounds,
      fitBoundsOptions: { padding: 50 },
      attributionControl: true,
      trackResize: true,
      renderWorldCopies: false,
      dragRotate: false,
      touchZoomRotate: true,
      touchPitch: false,
      cooperativeGestures: true,
      scrollZoom: {
        around: 'center',
      },
    })

    // Wait for map style to load before adding sources and layers
    map.current.on('style.load', () => {
      // Add navigation controls
      const nav = new mapboxgl.NavigationControl({
        showCompass: false,
        visualizePitch: false,
      })
      map.current?.addControl(nav, 'top-right')

      // Add markers
      validServices.forEach((service) => {
        const el = document.createElement('div')
        el.className = 'custom-marker'

        // Apply initial size based on current zoom
        if (map.current) {
          updateMarkerSize(el, map.current.getZoom())
        }

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
          pitchAlignment: 'map',
          rotationAlignment: 'map',
        })
          .setLngLat([service.stop.longitude, service.stop.latitude])
          .addTo(map.current!)

        markersRef.current.push(marker)

        el.addEventListener('click', () => {
          // Clear previous selection
          document
            .querySelectorAll('.custom-marker')
            .forEach((m) => m.classList.remove('selected'))
          el.classList.add('selected')

          // Add fly animation
          map.current?.flyTo({
            center: [service.stop.longitude, service.stop.latitude],
            zoom: 15,
            duration: 1500,
            essential: true,
            padding: { top: 100, bottom: 50, left: 50, right: 50 },
          })

          const routes = getRoutesForStop(service)

          handleStopSelect({
            name: service.stop.stop_name,
            code: service.stop.stop_code,
            sequence: service.sequence,
            streetName: service.stop.street_name,
            latitude: service.stop.latitude,
            longitude: service.stop.longitude,
            routes: routes,
          })
        })
      })

      // Add route shapes if available
      if (routeShapes && routeShapes.length > 0 && map.current) {
        // First remove any existing route layers and sources
        routeShapes.forEach((shape) => {
          const layerId = `route-line-${shape.direction}`
          const sourceId = `route-${shape.direction}`
          const arrowsId = `route-arrows-${shape.direction}`
          
          if (map.current?.getLayer(layerId)) {
            map.current.removeLayer(layerId)
          }
          if (map.current?.getLayer(arrowsId)) {
            map.current.removeLayer(arrowsId)
          }
          if (map.current?.getSource(sourceId)) {
            map.current.removeSource(sourceId)
          }
        })

        // Then add the new layers
        routeShapes.forEach((shape) => {
          const sourceId = `route-${shape.direction}`
          const layerId = `route-line-${shape.direction}`
          const arrowsId = `route-arrows-${shape.direction}`

          map.current?.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: shape.coordinates,
              },
            },
          })

          const lineColor = Number(shape.direction) === 1 ? '#4f46e5' : '#818cf8'

          // Add the main route line
          map.current?.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': lineColor,
              'line-width': 4,
              'line-opacity': 0.8,
            },
          })

          // Create custom arrow image - a simple arrow pointing up (90 degrees counterclockwise from right)
          const arrowSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 19V5M12 5L6 11M12 5L18 11" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 19V5M12 5L6 11M12 5L18 11" stroke="${lineColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`

          // Convert SVG to data URL
          const arrowUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(arrowSvg)

          // Load the arrow image
          const arrowImage = new Image()
          arrowImage.src = arrowUrl
          arrowImage.onload = () => {
            if (!map.current?.hasImage(`arrow-${shape.direction}`)) {
              map.current?.addImage(`arrow-${shape.direction}`, arrowImage as HTMLImageElement)
            }

            // Add the arrows layer with updated settings
            map.current?.addLayer({
              id: arrowsId,
              type: 'symbol',
              source: sourceId,
              layout: {
                'symbol-placement': 'line',
                'symbol-spacing': 80,
                'icon-image': `arrow-${shape.direction}`,
                'icon-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 0.5,
                  15, 1.0
                ],
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'icon-padding': 0,
                'icon-rotation-alignment': 'map',
                'icon-pitch-alignment': 'viewport',
                'icon-offset': [-10, 0],
                'icon-rotate': 90
              },
              paint: {
                'icon-opacity': 1
              },
            })
          }
        })
      }
    })

    // Add cooperative gestures warning
    const gestureText = {
      touch: 'Use two fingers to move the map',
      scroll: 'Hold Control or ⌘ key and scroll to zoom the map',
    }
    const coopGestureEl = document.createElement('div')
    coopGestureEl.className = 'mapboxgl-ctrl-top-left'
    coopGestureEl.style.pointerEvents = 'none'
    mapContainer.current.appendChild(coopGestureEl)

    map.current.on(
      'cooperative-gesture-warning',
      (e: CooperativeGestureEvent) => {
        coopGestureEl.innerHTML = `
        <div class="gesture-warning">
          ${gestureText[e.type]}
        </div>
      `
        setTimeout(() => {
          coopGestureEl.innerHTML = ''
        }, 1000)
      },
    )

    // Combine all styles
    styleElement.textContent = `
      .gesture-warning {
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 0.5rem 1rem;
        margin: 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        pointer-events: none;
        transition: opacity 0.2s;
      }
      .mapboxgl-ctrl-group {
        background: #1f2937 !important;
        border: 1px solid #374151 !important;
      }
      .mapboxgl-ctrl button {
        background-color: transparent !important;
      }
      .mapboxgl-ctrl button:hover {
        background-color: #374151 !important;
      }
      .mapboxgl-ctrl button span {
        filter: invert(1);
      }
      .custom-marker {
        width: 8px;
        height: 8px;
        background-color: #ffffff;
        border: 1px solid #1d4ed8;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .custom-marker:hover {
        transform: scale(1.3);
        border-color: #3b82f6;
      }
      .custom-marker.selected {
        background-color: #3b82f6;
        border-color: #ffffff;
        transform: scale(1.3);
      }
      .custom-marker.zoom-sm {
        width: 6px;
        height: 6px;
        border-width: 1px;
      }
      .custom-marker.zoom-md {
        width: 10px;
        height: 10px;
        border-width: 1.5px;
      }
      .custom-marker.zoom-lg {
        width: 16px;
        height: 16px;
        border-width: 2px;
      }

      /* Hide zoom controls on mobile */
      @media (max-width: 640px) {
        .mapboxgl-ctrl-zoom-in,
        .mapboxgl-ctrl-zoom-out {
          display: none !important;
        }
      }

      /* If you want to hide the entire control container on mobile */
      @media (max-width: 640px) {
        .mapboxgl-ctrl-group {
          display: none !important;
        }
      }
    `
    document.head.appendChild(styleElement)

    // Add zoom change handler
    map.current.on('zoom', () => {
      if (!map.current) return
      const zoom = map.current.getZoom()

      document.querySelectorAll('.custom-marker').forEach((marker) => {
        const isSelected = marker.classList.contains('selected')
        updateMarkerSize(marker as HTMLElement, zoom)
        if (isSelected) {
          marker.classList.add('selected')
        }
      })
    })

    return () => {
      document.head.removeChild(styleElement)
      markersRef.current.forEach((marker) => marker.remove())
      if (map.current) {
        routeShapes?.forEach((shape) => {
          const layerId = `route-line-${shape.direction}`
          const sourceId = `route-${shape.direction}`
          const arrowsId = `route-arrows-${shape.direction}`
          
          if (map.current?.getLayer(layerId)) {
            map.current.removeLayer(layerId)
          }
          if (map.current?.getLayer(arrowsId)) {
            map.current.removeLayer(arrowsId)
          }
          if (map.current?.getSource(sourceId)) {
            map.current.removeSource(sourceId)
          }
          if (map.current?.hasImage(`arrow-${shape.direction}`)) {
            map.current.removeImage(`arrow-${shape.direction}`)
          }
        })
        map.current.remove()
        map.current = null
      }
    }
  }, [services, routeShapes])

  return (
    <div className="relative h-full w-full">
      <div
        className={`absolute left-0 sm:left-4 top-4 z-10 w-full sm:w-72 origin-top-left transition-all duration-200 ${
          isVisible
            ? 'scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        <div className="mx-4 sm:mx-0 rounded-lg bg-gray-900/90 p-4 text-white backdrop-blur-sm relative">
          <button
            onClick={() => {
              setIsVisible(false)
              document
                .querySelectorAll('.custom-marker')
                .forEach((m) => m.classList.remove('selected'))
            }}
            className="absolute right-2 top-2 p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400 hover:text-white"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className="flex flex-col gap-2">
            {selectedStop && (
              <>
                <div className="flex items-center">
                  {selectedStop.code && (
                    <div className="font-medium mr-3 rounded-md px-2 py-1 text-sm bg-white/10 shrink-0">
                      {selectedStop.code}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-md font-medium">
                      {selectedStop.name}
                    </span>
                    {selectedStop.streetName && (
                      <p className="text-xs text-gray-400">
                        {selectedStop.streetName}
                      </p>
                    )}
                  </div>
                </div>

                <p className="font-medium text-sm pt-2">Routes:</p>
                <div className="flex flex-wrap gap-2 py-2">
                  {getUniqueRoutes(selectedStop.routes).map((route) => (
                    <Link
                      key={route.service_id}
                      href={`/routes/${route.route_number}`}
                      className="text-sm text-white/70 hover:text-white hover:bg-white/20 px-2 py-1 bg-white/10 rounded transition-colors duration-300"
                    >
                      {route.route_number}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div
        ref={mapContainer}
        className="h-full w-full rounded-lg"
        style={{ minHeight: '100%' }}
      />
    </div>
  )
}
