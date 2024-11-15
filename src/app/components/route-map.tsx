'use client'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef } from 'react'
import type { RouteStopWithData } from '../types/routes'

// Initialize mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''

interface RouteMapProps {
  services: RouteStopWithData[]
}

export function RouteMap({ services }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Filter out any services with undefined stops
    const validServices = services.filter((service): service is (typeof services[number] & { stop: NonNullable<typeof service.stop> }) => 
      service.stop !== undefined
    )

    if (validServices.length === 0) return

    // Create coordinates array for the route
    const coordinates = validServices.map((service) => [
      service.stop.longitude,
      service.stop.latitude,
    ] as [number, number])

    // Calculate center point
    const center = coordinates[0] ?? [-73.985428, 40.748817]

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: center,
      zoom: 13,
      attributionControl: true,
      trackResize: true,
      renderWorldCopies: false,
    })

    // Add navigation controls with dark theme
    const nav = new mapboxgl.NavigationControl({
      showCompass: false,
      visualizePitch: false,
    })
    map.current.addControl(nav, 'top-right')

    // Add custom styles for the navigation control and markers
    const style = document.createElement('style')
    style.textContent = `
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
      .mapboxgl-popup {
        transform-origin: 50% 0;
        animation: popup-appear 0.2s ease-out;
      }
      .mapboxgl-popup-content {
        background: #1f2937 !important;
        color: white !important;
        border: 1px solid #374151 !important;
        border-radius: 0.5rem !important;
        padding: 1rem !important;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
      }
      .mapboxgl-popup-tip {
        border-top-color: #1f2937 !important;
        border-bottom-color: #1f2937 !important;
      }
      .mapboxgl-popup-close-button {
        color: white !important;
        font-size: 1.25rem !important;
        padding: 0.5rem !important;
        line-height: 1 !important;
      }
      .mapboxgl-popup-close-button:hover {
        background-color: #374151 !important;
        border-top-right-radius: 0.5rem !important;
      }
      .custom-marker {
        width: 12px;
        height: 12px;
        background-color: #2563eb;
        border: 2px solid #1d4ed8;
        border-radius: 50%;
        cursor: pointer;
      }
      .custom-marker:hover {
        width: 16px;
        height: 16px;
        margin: -2px 0 0 -2px;
      }
      @keyframes popup-appear {
        from {
          opacity: 0;
          transform: scale(0.8) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `
    document.head.appendChild(style)

    map.current.on('load', () => {
      if (!map.current) return

      // Fit bounds to show all stops
      const bounds = new mapboxgl.LngLatBounds()
      coordinates.forEach((coord) => bounds.extend(coord))
      map.current.fitBounds(bounds, { padding: 50 })

      // Add markers for each stop
      validServices.forEach((service) => {
        const popup = new mapboxgl.Popup({
          offset: 15,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '300px',
        }).setHTML(`
          <div class="text-sm">
            <div class="font-medium mb-2 text-white/90">
              ${service.stop.stop_name}
            </div>
            <div class="space-y-1 text-white/70">
              <div class="flex items-center gap-2">
                <span class="font-medium">Stop Code:</span>
                ${service.stop.stop_code}
              </div>
              <div class="flex items-center gap-2">
                <span class="font-medium">Sequence:</span>
                ${service.sequence}
              </div>
              ${service.stop.street_name ? `
                <div class="flex items-center gap-2">
                  <span class="font-medium">Street:</span>
                  ${service.stop.street_name}
                </div>
              ` : ''}
            </div>
          </div>
        `)

        // Create a custom marker element
        const el = document.createElement('div')
        el.className = 'custom-marker'

        new mapboxgl.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([service.stop.longitude, service.stop.latitude])
          .setPopup(popup)
          .addTo(map.current!)
      })
    })

    return () => {
      document.head.removeChild(style)
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [services])

  return (
    <div 
      ref={mapContainer} 
      className="h-full w-full rounded-lg" 
      style={{ minHeight: '400px' }}
    />
  )
}
