import fs from 'fs'
import path from 'path'

// Read the routes file
const routesPath = path.join(process.cwd(), 'src', 'data', 'v2', 'routes.json')
const routes = JSON.parse(fs.readFileSync(routesPath, 'utf-8'))

// Process each route
routes.forEach((route: any) => {
  // Only process routes with exactly 2 trips
  if (route.trips.length === 2) {
    const [trip0, trip1] = route.trips

    // Swap headsign and fullShape
    const tempHeadsign = trip0.headsign
    const tempFullShape = trip0.fullShape

    trip0.headsign = trip1.headsign
    trip0.fullShape = trip1.fullShape

    trip1.headsign = tempHeadsign
    trip1.fullShape = tempFullShape
  }
})

// Write the updated data back to file
fs.writeFileSync(routesPath, JSON.stringify(routes, null, 2), 'utf-8')

console.log('Successfully swapped trip data')
