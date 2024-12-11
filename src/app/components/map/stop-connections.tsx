import { useEffect } from 'react'
import type { Service } from '@/types/routes'
import L from 'leaflet'
import { useMap } from 'react-leaflet'

export function StopConnections({
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

    // Create connections for active direction
    const connections = directionServices
      .slice(0, -1)
      .map((service, index) => {
        const nextService = directionServices[index + 1]
        if (!nextService) return null

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
