import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

interface RawShape {
  route_number: string
  direction: string
  sequence: string
  latitude: string
  longitude: string
}

interface ProcessedShape {
  routeNumber: string
  direction: number
  coordinates: [number, number][] // [longitude, latitude] pairs for Mapbox
}

async function processShapes() {
  const dataDir = path.join(process.cwd(), 'src/data/raw')
  const outputDir = path.join(process.cwd(), 'src/data/processed')

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Read shapes data
  const shapesContent = fs.readFileSync(
    path.join(dataDir, 'route_shapes.csv'),
    'utf-8',
  )

  const rawShapes = parse(shapesContent, {
    columns: true,
    skip_empty_lines: true,
  }) as RawShape[]

  // Group shapes by route and direction
  const shapesMap = new Map<string, [number, number][]>()

  rawShapes.forEach((shape) => {
    const key = `${shape.route_number}-${shape.direction}`
    if (!shapesMap.has(key)) {
      shapesMap.set(key, [])
    }

    // Store as [longitude, latitude] for GeoJSON compatibility
    shapesMap
      .get(key)
      ?.push([parseFloat(shape.longitude), parseFloat(shape.latitude)])
  })

  // Convert to final format
  const processedShapes: ProcessedShape[] = Array.from(shapesMap.entries())
    .map(([key, coordinates]) => {
      const [routeNum, directionStr] = key.split('-')
      if (!routeNum || !directionStr) {
        throw new Error(`Invalid key format: ${key}`)
      }
      return {
        routeNumber: routeNum,
        direction: parseInt(directionStr),
        coordinates,
      }
    })
    .sort((a, b) => {
      const routeCompare = a.routeNumber.localeCompare(b.routeNumber)
      if (routeCompare !== 0) return routeCompare
      return a.direction - b.direction
    })

  // Write processed shapes as JSON
  fs.writeFileSync(
    path.join(outputDir, 'shapes.json'),
    JSON.stringify(processedShapes, null, 2),
  )

  console.log(`Processed ${processedShapes.length} route shapes`)
  console.log(`Total coordinates: ${rawShapes.length}`)
}

processShapes().catch(console.error)
