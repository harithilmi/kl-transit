import polyline from '@mapbox/polyline'
import fs from 'fs/promises'
import path from 'path'

interface Route {
  routeId: number
  trips: Trip[]
  // ... other fields
}

interface Trip {
  tripId: number
  fullShape: string
  // ... other fields
}

async function flipShapes() {
  try {
    // Read the routes file
    const routesPath = path.join(
      process.cwd(),
      'src',
      'data',
      'v2',
      'routes.json',
    )
    const routesData = await fs.readFile(routesPath, 'utf-8')
    const routes: Route[] = JSON.parse(routesData)

    // Process each route and its trips
    for (const route of routes) {
      for (const trip of route.trips) {
        // Decode the polyline
        const coordinates = polyline.decode(trip.fullShape)

        // Reverse the coordinates array
        const flippedCoordinates = coordinates.reverse()

        // Encode back to polyline
        trip.fullShape = polyline.encode(flippedCoordinates)
      }
    }

    // Write the updated data back to file
    await fs.writeFile(routesPath, JSON.stringify(routes, null, 2), 'utf-8')

    console.log('Successfully flipped all shape coordinates')
  } catch (error) {
    console.error('Error processing shapes:', error)
    process.exit(1)
  }
}

// Run the script
flipShapes()
