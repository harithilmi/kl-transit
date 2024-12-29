// scripts/clean-transit-data.ts
import { promises as fs } from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

// Interfaces
interface RawStop {
  id: number
  stop_id: string
  stop_code: string
  stop_name: string
  street_name: string | null
  latitude: number
  longitude: number
  created_at: string
  updated_at: string
}

interface CleanStop {
  stop_id: number
  stop_code?: string
  mrt_stop_id?: number
  rapid_stop_id?: number
  stop_name: string
  street_name?: string
  latitude: number
  longitude: number
}

interface RawCSVStop {
  stop_id: string
  stop_code?: string
  stop_name: string
  street_name?: string
  latitude: number
  longitude: number
}

interface StopMapping {
  rapidId?: string
  mrtId?: string
  stop_code?: string
  stop_name: string
  street_name?: string
  latitude: number
  longitude: number
}

// Helper function to find exact coordinate matches
function findExactMatch(
  lat: number,
  lon: number,
  sourceStops: RawCSVStop[],
): RawCSVStop | null {
  return (
    sourceStops.find(
      (stop) =>
        Math.abs(parseFloat(stop.latitude.toString()) - lat) < 0.00001 &&
        Math.abs(parseFloat(stop.longitude.toString()) - lon) < 0.00001,
    ) ?? null
  )
}

// Helper to check if a string is a valid numeric ID
function isValidNumericId(id: string): boolean {
  return /^[0-9]+$/.test(id)
}

// Add manual mappings for stops that can't be matched automatically
const MANUAL_STOP_MAPPING: Record<
  string,
  { rapidId?: string; mrtId?: string }
> = {
  // Format: "coordinate-based ID": { rapidId?: "1XXXXXX", mrtId?: "12XXXXX" }
  N3059793E101793608: { mrtId: '12001849' },
  N2950286E101656930: { mrtId: '12003053' },
  N3074034E101744225: { mrtId: '12003056' }, // Name is wrong in raw data: KL412 PRIMA ALAM DAMAI when actually it's actualy Komersial Taman Len Seng (2) in  from_db/kl-transit_stop_converted.json
  N3074479E101738490: { mrtId: '12003055' }, // Name is wrong in from_db/kl-transit_stop_converted.json: PETRONAS PETRONAS ALAM DAMAI when actually it's PETRONAS ALAM DAMAI (OPP) in raw data
  N3146748E101662822: { rapidId: '1002013' },
  N3150606E101691297: { rapidId: '' },
  N3170092E101564068: { mrtId: '12003067' },
  N3186979E101663839: { rapidId: '1008084' },
}

async function buildStopMap() {
  // Read all source files
  const [
    rawStopsData,
    rawRapidStops,
    rawMrtStops,
    rawAllBusStops,
  ] = await Promise.all([
    fs.readFile(
      path.join(
        process.cwd(),
        'src/data/from_db/kl-transit_stop_converted.json',
      ),
      'utf-8',
    ),
    fs.readFile(
      path.join(process.cwd(), 'src/data/raw/stops_rapid.csv'),
      'utf-8',
    ),
    fs.readFile(
      path.join(process.cwd(), 'src/data/raw/stops_mrt.csv'),
      'utf-8',
    ),
    fs.readFile(
      path.join(process.cwd(), 'src/data/raw/all_bus_stops.csv'),
      'utf-8',
    ),
  ])

  const stops = JSON.parse(rawStopsData) as RawStop[]

  // Parse all CSV files
  const rapidStops = parse(rawRapidStops, {
    columns: ['stop_id', 'stop_name', 'stop_desc', 'stop_lat', 'stop_lon'],
    skip_empty_lines: true,
  }).map((stop: any) => ({
    stop_id: stop.stop_id,
    stop_name: stop.stop_name,
    street_name: stop.stop_desc,
    latitude: parseFloat(stop.stop_lat),
    longitude: parseFloat(stop.stop_lon),
  })) as RawCSVStop[]

  const mrtStops = parse(rawMrtStops, {
    columns: ['stop_id', 'stop_code', 'stop_name', 'stop_lat', 'stop_lon'],
    skip_empty_lines: true,
  }).map((stop: any) => ({
    stop_id: stop.stop_id,
    stop_code: stop.stop_code,
    stop_name: stop.stop_name,
    latitude: parseFloat(stop.stop_lat),
    longitude: parseFloat(stop.stop_lon),
  })) as RawCSVStop[]

  const allBusStops = parse(rawAllBusStops, {
    columns: [
      'route_number',
      'stop_id',
      'stop_name',
      'street_name',
      'latitude',
      'longitude',
      'direction',
      'zone',
    ],
    skip_empty_lines: true,
  })
    .map((stop: any) => ({
      stop_id: isValidNumericId(stop.stop_id) ? stop.stop_id : undefined, // Only use if numeric
      stop_name: stop.stop_name,
      street_name: stop.street_name,
      latitude: parseFloat(stop.latitude),
      longitude: parseFloat(stop.longitude),
    }))
    .filter((stop) => stop.stop_id) as RawCSVStop[] // Filter out stops without valid IDs

  const stopMap = new Map<string, StopMapping>()

  // Process each stop
  stops.forEach((stop) => {
    const coordKey = stop.stop_id

    // Find matches in all three sources
    const matchingRapidStop = findExactMatch(
      stop.latitude,
      stop.longitude,
      rapidStops,
    )
    const matchingMrtStop = findExactMatch(
      stop.latitude,
      stop.longitude,
      mrtStops,
    )
    const matchingBusStop = findExactMatch(
      stop.latitude,
      stop.longitude,
      allBusStops,
    )

    // Check manual mapping
    const manualMapping = MANUAL_STOP_MAPPING[coordKey]

    const stopMapping: StopMapping = {
      stop_name: stop.stop_name,
      stop_code: stop.stop_code || undefined,
      street_name: stop.street_name || undefined,
      latitude: stop.latitude,
      longitude: stop.longitude,
    }

    // Add IDs if matches found (in priority order)
    if (matchingRapidStop) {
      stopMapping.rapidId = matchingRapidStop.stop_id
    }
    if (matchingMrtStop) {
      stopMapping.mrtId = matchingMrtStop.stop_id
      stopMapping.stop_code = matchingMrtStop.stop_code
    }
    if (matchingBusStop?.stop_id && !stopMapping.rapidId) {
      stopMapping.rapidId = matchingBusStop.stop_id
    }

    // Apply manual mapping if exists
    if (manualMapping) {
      if (manualMapping.rapidId) stopMapping.rapidId = manualMapping.rapidId
      if (manualMapping.mrtId) stopMapping.mrtId = manualMapping.mrtId
    }

    stopMap.set(coordKey, stopMapping)
  })

  return stopMap
}

async function cleanStopData() {
  try {
    const stopMap = await buildStopMap()
    const rawData = await fs.readFile(
      path.join(
        process.cwd(),
        'src/data/from_db/kl-transit_stop_converted.json',
      ),
      'utf-8',
    )
    const stops = JSON.parse(rawData) as RawStop[]

    // let unmatchedCount = 0

    const cleanedStops: CleanStop[] = stops.map((stop) => {
      const mapping = stopMap.get(stop.stop_id)

      // Convert IDs to numbers
      const rapidId = mapping?.rapidId ? parseInt(mapping.rapidId) : undefined
      const mrtId = mapping?.mrtId ? parseInt(mapping.mrtId) : undefined

      if (!rapidId && !mrtId) {
        console.log('stop_id', stop.stop_id)
        console.log('stop_name', stop.stop_name)
        console.log('stop_code', stop.stop_code)
        console.log('street_name', stop.street_name)
        console.log('latitude', stop.latitude)
        console.log('longitude', stop.longitude, '\n')
      }

      return {
        stop_id:
          rapidId ?? mrtId ?? parseInt(stop.stop_id.replace(/[^0-9]/g, '')),
        stop_name: stop.stop_name,
        stop_code: mapping?.stop_code,
        street_name: stop.street_name || mapping?.street_name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        ...(rapidId && { rapid_stop_id: rapidId }),
        ...(mrtId && { mrt_stop_id: mrtId }),
      }
    })

    // Print summary
    console.log('\nMatching Summary:')
    console.log(`Total stops: ${stops.length}`)

    await fs.writeFile(
      path.join(process.cwd(), 'src/data/from_db/kl-transit_stop.clean.json'),
      JSON.stringify(cleanedStops, null, 2),
    )

    console.log('\nSuccessfully cleaned stop data')
    return stopMap
  } catch (error) {
    console.error('Error cleaning stop data:', error)
    throw error
  }
}

// Main execution
async function main() {
  await cleanStopData()
}

main().catch(console.error)
