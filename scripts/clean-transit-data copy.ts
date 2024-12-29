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
  stop_name: string
  stop_code?: string
  street_name?: string
  latitude: number
  longitude: number
  rapid_stop_id?: number
  mrt_stop_id?: number
  old_stop_id: string
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
  oldStopIds: string[] // Array of coordinate-based IDs
  stop_name: string
  street_name?: string
  latitude: number
  longitude: number
  stop_code?: string
  mrtId?: string
}

// Add new interface for service data
interface Service {
  route_number: string
  stop_id: string
  direction: 1 | 2
  zone: number
  sequence: number
}

const MANUAL_STOP_MAPPING: StopIdMapping = {
  rapid: {
    '1002013': ['N3146748E101662822'],
    '1008084': ['N3186979E101663839'],
  },
  mrt: {
    '12001849': ['N3059793E101793608'],
    '12003053': ['N2950286E101656930'],
    '12003056': ['N3074034E101744225'], // Komersial Taman Len Seng (2)
    '12003055': ['N3074479E101738490'], // PETRONAS ALAM DAMAI (OPP)
    '12003067': ['N3170092E101564068'],
  },
}

// Helper function to find manual mapping
function findManualMapping(stopId: string, mapping: StopIdMapping) {
  const rapidId = Object.entries(mapping.rapid).find(([_, stopIds]) =>
    stopIds.includes(stopId),
  )?.[0]
  const mrtId = Object.entries(mapping.mrt).find(([_, stopIds]) =>
    stopIds.includes(stopId),
  )?.[0]

  return { rapidId, mrtId }
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

// Add this helper function to get routes for a stop
async function getRoutesForStop(stopId: string): Promise<string[]> {
  const servicesData = await fs.readFile(
    path.join(process.cwd(), 'src/data/from_db/kl-transit_service.json'),
    'utf-8',
  )
  const services = JSON.parse(servicesData) as Service[]

  return [
    ...new Set(
      services
        .filter((service) => service.stop_id === stopId)
        .map((service) => service.route_number),
    ),
  ]
}

// Add helper to check if stops are identical
function areStopsIdentical(stop1: RawStop, stop2: RawStop): boolean {
  return (
    stop1.stop_name === stop2.stop_name &&
    stop1.stop_code === stop2.stop_code &&
    stop1.street_name === stop2.street_name &&
    Math.abs(stop1.latitude - stop2.latitude) < 0.0001 &&
    Math.abs(stop1.longitude - stop2.longitude) < 0.0001
  )
}

// Modify the printDuplicatesTable function
async function printDuplicatesTable(
  duplicates: [string, RawStop[]][],
  type: 'Rapid' | 'MRT',
) {
  if (duplicates.length === 0) return

  const autoResolvable: {
    id: string
    stop: RawStop
    routes: string[]
  }[] = []

  const needsManualResolve: {
    id: string
    stops: RawStop[]
    routes: string[][]
  }[] = []

  // Process all duplicates first
  for (const [id, stops] of duplicates) {
    if (stops.length !== 2) {
      needsManualResolve.push({
        id,
        stops,
        routes: await Promise.all(
          stops.map((stop) => getRoutesForStop(stop.stop_id)),
        ),
      })
      continue
    }

    // Check if stops are identical first
    if (areStopsIdentical(stops[0], stops[1])) {
      const allRoutes = await Promise.all([
        getRoutesForStop(stops[0].stop_id),
        getRoutesForStop(stops[1].stop_id),
      ])
      autoResolvable.push({
        id,
        stop: stops[0], // Use first stop since they're identical
        routes: [...allRoutes[0], ...allRoutes[1]],
      })
      continue
    }

    const [stop1Routes, stop2Routes] = await Promise.all([
      getRoutesForStop(stops[0].stop_id),
      getRoutesForStop(stops[1].stop_id),
    ])

    const isSingleRouteCase =
      stop1Routes.length === 1 && stop2Routes.length === 1

    if (isSingleRouteCase) {
      const stop1HasT = stop1Routes.some((route) => route.startsWith('T'))
      const stop2HasT = stop2Routes.some((route) => route.startsWith('T'))

      if (stop1HasT !== stop2HasT) {
        const preferredStop = stop1HasT ? stops[0] : stops[1]
        autoResolvable.push({
          id,
          stop: preferredStop,
          routes: [...stop1Routes, ...stop2Routes],
        })
        continue
      }
    }

    needsManualResolve.push({
      id,
      stops,
      routes: [stop1Routes, stop2Routes],
    })
  }

  // Print auto-resolvable cases
  if (autoResolvable.length > 0) {
    console.log(`\nAuto-resolvable ${type} ID duplicates:`)
    console.log('-'.repeat(120))
    console.log(
      '|ID'.padEnd(9) +
        '|Name'.padEnd(30) +
        '|Code'.padEnd(7) +
        '|Street'.padEnd(20) +
        '|Coords'.padEnd(22) +
        '|Old ID'.padEnd(20) +
        '|Routes|',
    )
    console.log('-'.repeat(120))

    for (const { id, stop, routes } of autoResolvable) {
      const coords = `${stop.latitude.toFixed(4)},${stop.longitude.toFixed(4)}`
      console.log(
        `|${id}`.padEnd(9) +
          `|${(stop.stop_name || '').slice(0, 28)}`.padEnd(30) +
          `|${(stop.stop_code || '').slice(0, 5)}`.padEnd(7) +
          `|${(stop.street_name || '').slice(0, 18)}`.padEnd(20) +
          `|${coords}`.padEnd(22) +
          `|${stop.stop_id}`.padEnd(20) +
          `|${routes.join(', ')}`,
      )
    }
  }

  // Print manual resolution cases
  if (needsManualResolve.length > 0) {
    console.log(`\n${type} ID Manual Resolution Required:`)
    console.log('-'.repeat(130))
    console.log(
      '|ID'.padEnd(9) +
        '|Name'.padEnd(30) +
        '|Code'.padEnd(7) +
        '|Street'.padEnd(20) +
        '|Coords'.padEnd(22) +
        '|Old ID'.padEnd(20) +
        '|Routes|',
    )
    console.log('-'.repeat(130))

    for (const { id, stops, routes } of needsManualResolve) {
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i]
        const coords = `${stop.latitude.toFixed(4)},${stop.longitude.toFixed(
          4,
        )}`
        console.log(
          `|${id}`.padEnd(9) +
            `|${(stop.stop_name || '').slice(0, 28)}`.padEnd(30) +
            `|${(stop.stop_code || '').slice(0, 5)}`.padEnd(7) +
            `|${(stop.street_name || '').slice(0, 18)}`.padEnd(20) +
            `|${coords}`.padEnd(22) +
            `|${stop.stop_id}`.padEnd(20) +
            `|${routes[i].join(', ')}`,
        )
      }
      console.log('-'.repeat(130))
    }
  }
}

// Update the type definition
type StopIdMapping = {
  rapid: Record<string, string[]>
  mrt: Record<string, string[]>
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

  // Create arrays to store duplicates
  const rapidDuplicates: [string, RawStop[]][] = []
  const mrtDuplicates: [string, RawStop[]][] = []
  const noIdStops: RawStop[] = []
  const stopIdMapping: StopIdMapping = {
    rapid: {},
    mrt: {},
  }

  // First pass: collect all stops by their IDs
  const rapidStopGroups = new Map<string, RawStop[]>()
  const mrtStopGroups = new Map<string, RawStop[]>()

  for (const stop of stops) {
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
    const { rapidId: manualRapidId, mrtId: manualMrtId } = findManualMapping(
      stop.stop_id,
      MANUAL_STOP_MAPPING,
    )

    const rapidId =
      matchingRapidStop?.stop_id || manualRapidId || matchingBusStop?.stop_id
    const mrtId = matchingMrtStop?.stop_id || manualMrtId

    if (rapidId) {
      if (!rapidStopGroups.has(rapidId)) {
        rapidStopGroups.set(rapidId, [])
      }
      rapidStopGroups.get(rapidId)?.push(stop)

      // Build the Rapid ID mapping
      if (!stopIdMapping.rapid[rapidId]) {
        stopIdMapping.rapid[rapidId] = []
      }
      stopIdMapping.rapid[rapidId].push(stop.stop_id)
    }

    if (mrtId) {
      if (!mrtStopGroups.has(mrtId)) {
        mrtStopGroups.set(mrtId, [])
      }
      mrtStopGroups.get(mrtId)?.push(stop)

      // Build the MRT ID mapping
      if (!stopIdMapping.mrt[mrtId]) {
        stopIdMapping.mrt[mrtId] = []
      }
      stopIdMapping.mrt[mrtId].push(stop.stop_id)
    }

    if (!rapidId && !mrtId) {
      noIdStops.push(stop)
    }
  }

  // Collect duplicates
  for (const [id, groupStops] of rapidStopGroups) {
    if (groupStops.length > 1) {
      rapidDuplicates.push([id, groupStops])
    }
  }

  for (const [id, groupStops] of mrtStopGroups) {
    if (groupStops.length > 1) {
      mrtDuplicates.push([id, groupStops])
    }
  }

  // Print duplicate analysis
  await printDuplicatesTable(rapidDuplicates, 'Rapid')
  await printDuplicatesTable(mrtDuplicates, 'MRT')

  // Write the mapping file
  await fs.writeFile(
    path.join(process.cwd(), 'src/data/from_db/stop_id_mapping.json'),
    JSON.stringify(stopIdMapping, null, 2),
  )

  return {
    stopIdMapping,
    stops,
    stats: {
      rapidDuplicates,
      mrtDuplicates,
      noIdStops,
    },
  }
}

async function cleanStopData() {
  try {
    const { stopIdMapping, stops, stats } = await buildStopMap()

    // Create cleaned stops
    const cleanedStops: CleanStop[] = []
    let currentStopId = 1

    // Process Rapid ID mappings
    for (const [rapidId, oldStopIds] of Object.entries(stopIdMapping.rapid)) {
      const originalStop = stops.find((s) => s.stop_id === oldStopIds[0])
      if (!originalStop) continue

      // Find if this stop also has an MRT ID
      let mrtId: string | undefined
      for (const [mId, mStopIds] of Object.entries(stopIdMapping.mrt)) {
        if (mStopIds.some((id) => oldStopIds.includes(id))) {
          mrtId = mId
          break
        }
      }

      const cleanedStop: CleanStop = {
        stop_id: currentStopId++,
        stop_name: originalStop.stop_name,
        stop_code: originalStop.stop_code || undefined,
        street_name: originalStop.street_name || undefined,
        latitude: originalStop.latitude,
        longitude: originalStop.longitude,
        rapid_stop_id: parseInt(rapidId),
        ...(mrtId && { mrt_stop_id: parseInt(mrtId) }),
        old_stop_id: oldStopIds.join(','),
      }

      cleanedStops.push(cleanedStop)
    }

    // Process MRT ID mappings that don't have Rapid IDs
    for (const [mrtId, oldStopIds] of Object.entries(stopIdMapping.mrt)) {
      // Skip if any of these stops were already processed with a Rapid ID
      if (
        oldStopIds.some((id) =>
          Object.values(stopIdMapping.rapid).flat().includes(id),
        )
      ) {
        continue
      }

      const originalStop = stops.find((s) => s.stop_id === oldStopIds[0])
      if (!originalStop) continue

      const cleanedStop: CleanStop = {
        stop_id: currentStopId++,
        stop_name: originalStop.stop_name,
        stop_code: originalStop.stop_code || undefined,
        street_name: originalStop.street_name || undefined,
        latitude: originalStop.latitude,
        longitude: originalStop.longitude,
        mrt_stop_id: parseInt(mrtId),
        old_stop_id: oldStopIds.join(','),
      }

      cleanedStops.push(cleanedStop)
    }

    // Write cleaned stops
    await fs.writeFile(
      path.join(process.cwd(), 'src/data/from_db/kl-transit_stop.clean.json'),
      JSON.stringify(cleanedStops, null, 2),
    )

    console.log('\nProcessing Summary:')
    console.log(`Total stops: ${stops.length}`)
    console.log(`Unique stops after combining: ${cleanedStops.length}`)
    console.log(
      `Stops with duplicate Rapid IDs: ${stats.rapidDuplicates.length}`,
    )
    console.log(`Stops with duplicate MRT IDs: ${stats.mrtDuplicates.length}`)
    console.log(`Stops with no IDs: ${stats.noIdStops.length}`)

    return { stopIdMapping }
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
