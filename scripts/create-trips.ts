import fs from 'fs'
import path from 'path'
import polylineCodec from '@googlemaps/polyline-codec'

interface Route {
  routeId: number
  routeShortName: string
  routeLongName: string
  operatorId: string
  networkId: string
  routeType: number
  routeColor: string
  routeTextColor: string
  trips: Trip[]
}

interface Service {
  route_number: string
  stop_id: number
  direction: 1 | 2
  zone: 1 | 2 | 3
  sequence: number
}

interface Shape {
  route_number: string
  direction: 1 | 2
  coordinates: [number, number][]
}

interface Trip {
  tripId: number
  routeId: number
  headsign: string
  direction: 0 | 1 | null
  isActive: boolean
  fullShape: string // Encoded polyline from shapes.json
  stopDetails: StopDetail[]
  stopPairSegments: StopPairSegment[]
}

interface StopDetail {
  stopId: number
  fareZone: 1 | 2 | 3
}

interface StopPairSegment {
  fromStopId: number
  toStopId: number
  distance: null // To be filled by routing engine
  segmentShape: null // To be filled by routing engine
}

async function createTrips() {
  try {
    // Read input files
    const routesPath = path.join(process.cwd(), 'src/data/v2/routes.json')
    const servicesPath = path.join(
      process.cwd(),
      'src/data/clean/services.json',
    )
    const shapesPath = path.join(process.cwd(), 'src/data/clean/shapes.json')

    const routes: Route[] = JSON.parse(fs.readFileSync(routesPath, 'utf-8'))
    const services: Service[] = JSON.parse(
      fs.readFileSync(servicesPath, 'utf-8'),
    )
    const shapes: Shape[] = JSON.parse(fs.readFileSync(shapesPath, 'utf-8'))

    // Process each route
    for (const route of routes) {
      const routeServices = services.filter(
        (s) => s.route_number === route.routeShortName,
      )
      const routeShapes = shapes.filter(
        (s) => s.route_number === route.routeShortName,
      )

      const trips: Trip[] = []

      // Process each direction
      for (const direction of [1, 2]) {
        const directionServices = routeServices.filter(
          (s) => s.direction === direction,
        )
        const directionShape = routeShapes.find(
          (s) => s.direction === direction,
        )

        // Skip if no services or shape for this direction
        if (!directionServices.length || !directionShape) continue

        // Sort services by sequence
        directionServices.sort((a, b) => a.sequence - b.sequence)

        // Create stop details
        const stopDetails: StopDetail[] = directionServices.map((service) => ({
          stopId: service.stop_id,
          fareZone: service.zone,
        }))

        // Create stop pair segments
        const stopPairSegments: StopPairSegment[] = []
        for (let i = 0; i < stopDetails.length - 1; i++) {
          stopPairSegments.push({
            fromStopId: stopDetails[i].stopId,
            toStopId: stopDetails[i + 1].stopId,
            distance: null,
            segmentShape: null,
          })
        }

        // Create encoded polyline from shape coordinates
        const fullShape = polylineCodec.encode(
          // Swap longitude,latitude to latitude,longitude for Google compatibility
          directionShape.coordinates.map(([lng, lat]) => [lat, lng]),
        )

        // Create trip
        const trip: Trip = {
          tripId: direction === 1 ? route.routeId * 2 - 1 : route.routeId * 2,
          routeId: route.routeId,
          headsign:
            route.routeLongName.split('⇌')[direction - 1]?.trim() ||
            route.routeLongName.split('↺')[0]?.trim() ||
            route.routeLongName,
          direction: direction === 1 ? 0 : 1,
          isActive: true,
          fullShape,
          stopDetails,
          stopPairSegments,
        }

        trips.push(trip)
      }

      // Update route with trips
      route.trips = trips
    }

    // Write updated routes back to file
    fs.writeFileSync(routesPath, JSON.stringify(routes, null, 2))
    console.log('Successfully updated routes with trips')
  } catch (error) {
    console.error('Error creating trips:', error)
  }
}

createTrips()
