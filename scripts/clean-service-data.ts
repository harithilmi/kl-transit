import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Types
interface RawService {
  id?: number
  route_number: string
  stop_id: string
  direction: 1 | 2
  zone: number
  sequence: number
  created_at?: string
  updated_at?: string
}

interface CleanService {
  route_number: string
  stop_id: number
  direction: 1 | 2
  zone: number
  sequence: number
}

interface CleanStop {
  stop_id: number
  stop_name: string
  stop_code?: string
  street_name?: string
  latitude: number
  longitude: number
  rapid_stop_id?: number
  mrt_stop_id?: number
  old_stop_id: string
}

async function main() {
  // Read files
  const servicesPath = resolve(
    __dirname,
    '../src/data/from_db/kl-transit_service.json',
  )
  const stopsPath = resolve(
    __dirname,
    '../src/data/from_db/kl-transit_stop.clean.json',
  )

  const services: RawService[] = JSON.parse(readFileSync(servicesPath, 'utf-8'))
  const stops: CleanStop[] = JSON.parse(readFileSync(stopsPath, 'utf-8'))

  // Create mapping from old stop IDs to new sequential IDs
  const stopIdMap = new Map<string, number>()
  stops.forEach((stop) => {
    // Split old_stop_id on commas and map each ID
    const oldIds = stop.old_stop_id.split(',')
    oldIds.forEach((id) => {
      stopIdMap.set(id.trim(), stop.stop_id)
    })

    // Map existing IDs
    if (stop.rapid_stop_id) {
      stopIdMap.set(stop.rapid_stop_id.toString(), stop.stop_id)
    }
    if (stop.mrt_stop_id) {
      stopIdMap.set(stop.mrt_stop_id.toString(), stop.stop_id)
    }
  })

  // Track unique missing IDs for statistics
  const missingIds = new Set<string>()

  // Clean services
  const cleanedServices = services
    .map((service) => {
      const oldStopId = service.stop_id
      const newStopId = stopIdMap.get(oldStopId)

      if (!newStopId) {
        missingIds.add(oldStopId)
        console.warn(`Warning: No mapping found for stop_id ${oldStopId}`)
        return null
      }

      return {
        route_number: service.route_number,
        stop_id: newStopId,
        direction: service.direction,
        zone: service.zone,
        sequence: service.sequence,
      }
    })
    .filter((service): service is CleanService => service !== null)

  // Sort by route_number, direction, and sequence
  cleanedServices.sort((a, b) => {
    if (a.route_number !== b.route_number) {
      return a.route_number.localeCompare(b.route_number)
    }
    if (a.direction !== b.direction) {
      return a.direction - b.direction
    }
    return a.sequence - b.sequence
  })

  // Log statistics
  console.log('\nMapping Statistics:')
  console.log(`Total unique missing mappings: ${missingIds.size}`)
  console.log(`Total services processed: ${services.length}`)
  console.log(`Services with valid mappings: ${cleanedServices.length}`)
  console.log(`Services dropped: ${services.length - cleanedServices.length}`)
  console.log(
    `Mapping success rate: ${(
      (cleanedServices.length / services.length) *
      100
    ).toFixed(2)}%`,
  )

  // Write cleaned data
  const outputPath = resolve(
    __dirname,
    '../src/data/from_db/kl-transit_service.clean.json',
  )
  writeFileSync(outputPath, JSON.stringify(cleanedServices, null, 2))

  console.log(`Cleaned ${cleanedServices.length} services`)
  console.log(`Output written to ${outputPath}`)
}

main().catch(console.error)
