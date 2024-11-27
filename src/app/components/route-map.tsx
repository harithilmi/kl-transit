'use client'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef } from 'react'
import type { Service, RouteShape } from '../types/routes'

interface RouteMapProps {
  services: Service[]
  shape: {
    direction1: RouteShape
    direction2: RouteShape
  }
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

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [101.6958, 3.1466],
      zoom: 11,
      maxZoom: 18,
    })

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
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            3,
            13,
            5,
            15,
            8,
          ],
          'circle-color': '#ffffff',
          'circle-stroke-color': '#1d4ed8',
          'circle-stroke-width': 1,
          'circle-opacity': 1,
        },
      })

      // Add hover effect layer
      map.addLayer({
        id: 'stops-hover',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            4,
            13,
            6,
            15,
            10,
          ],
          'circle-color': '#3b82f6',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1,
          'circle-opacity': 0,
        },
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

      // Add hover interactivity
      map.on(
        'mousemove',
        'stops',
        (e: mapboxgl.MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
          if (e.features && e.features.length > 0) {
            map.setPaintProperty('stops-hover', 'circle-opacity', 1)
            map.setFilter('stops-hover', [
              '==',
              ['get', 'code'],
              e.features[0]?.properties?.code,
            ])
          }
        },
      )

      map.on('mouseleave', 'stops', () => {
        map.setPaintProperty('stops-hover', 'circle-opacity', 0)
        map.setFilter('stops-hover', null)
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
        map.fitBounds(bounds, { padding: 50 })
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={mapContainer} className="w-full h-full" />
}
