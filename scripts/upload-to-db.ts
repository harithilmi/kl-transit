import 'dotenv/config'
import { db } from '~/server/db'
import { routes, routeShapes } from '~/server/db/schema'
import { sql, eq } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

function shouldExcludeRoute(routeNumber: string): boolean {
  return (
    routeNumber.endsWith('B') || // Skip routes ending with B
    routeNumber.includes('(OS)') || // Skip routes with (OS)
    routeNumber.startsWith('SEWA') || // Skip SEWA routes
    routeNumber.startsWith('KTM') || // Skip KTM routes
    routeNumber.startsWith('GP') || // Skip GP routes
    routeNumber.includes('MAHA') || // Skip MAHA event shuttles
    routeNumber === 'PARASUKMA SARAWAK 2024' || // Skip specific event route
    routeNumber === 'MS04' || // Skip MS04 route
    routeNumber === 'MS05' // Skip MS05 route
  )
}

async function uploadData() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set')
  }

  const dataDir = path.join(process.cwd(), 'src/data/processed')
  const rawDir = path.join(process.cwd(), 'src/data/raw')
  
  // First, get all valid routes from routes.json
  console.log('Reading routes data...')
  const routesData = JSON.parse(
    fs.readFileSync(path.join(rawDir, 'routes.json'), 'utf-8')
  )
  const validRouteNumbers = new Set(Object.keys(routesData))

  console.log('Uploading route shapes...')
  const shapesData = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'shapes.json'), 'utf-8')
  )

  // Filter out excluded routes, routes with names too long, and routes not in routes.json
  const validShapes = shapesData.filter((shape: any) => {
    const isValid = 
      shape.routeNumber && 
      shape.routeNumber.length <= 20 && 
      typeof shape.direction === 'number' && 
      Array.isArray(shape.coordinates) &&
      shape.coordinates.length > 0 &&
      !shouldExcludeRoute(shape.routeNumber) &&
      validRouteNumbers.has(shape.routeNumber)

    if (!isValid) {
      console.log('Skipping invalid/excluded shape:', shape.routeNumber)
    }

    return isValid
  })

  try {
    console.log(`Processing ${validShapes.length} valid shapes out of ${shapesData.length} total`)

    // First ensure all routes exist
    for (const shape of validShapes) {
      const routeInfo = routesData[shape.routeNumber]
      if (routeInfo) {
        await db.insert(routes).values({
          routeNumber: shape.routeNumber,
          routeName: routeInfo.route_name,
          routeType: routeInfo.route_type,
        }).onConflictDoNothing()
      }
    }

    // Then insert shapes
    await db.insert(routeShapes).values(validShapes)
      .onConflictDoUpdate({
        target: [routeShapes.routeNumber, routeShapes.direction],
        set: {
          coordinates: sql`EXCLUDED.coordinates`
        }
      })
    console.log(`Successfully uploaded ${validShapes.length} route shapes`)

    // Clean up any existing excluded routes
    const existingShapes = await db.select({
      routeNumber: routeShapes.routeNumber
    }).from(routeShapes)

    const routesToRemove = existingShapes
      .filter(shape => shouldExcludeRoute(shape.routeNumber))
      .map(shape => shape.routeNumber)

    if (routesToRemove.length > 0) {
      console.log(`Found ${routesToRemove.length} existing routes to remove:`)
      console.log(routesToRemove)

      for (const routeNumber of routesToRemove) {
        try {
          await db.delete(routeShapes)
            .where(eq(routeShapes.routeNumber, routeNumber))
          console.log(`Deleted route: ${routeNumber}`)
        } catch (error) {
          console.error(`Error deleting route ${routeNumber}:`, error)
        }
      }
    }

  } catch (error) {
    console.error('Error processing shapes:', error)
  }

  console.log('Upload complete!')
}

uploadData().catch(console.error) 