import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'
import { cleanStopName, cleanStreetName } from './clean-names'

interface RawStop {
  route_number: string
  stop_id: string
  stop_name: string
  street_name: string
  latitude: string
  longitude: string
  direction: string
  zone: string
}

interface ProcessedStop {
  stop_id: string // New ID based on coordinates
  stop_code: string // Extracted code (KL123, PJ456, etc.)
  stop_name: string // Cleaned name
  street_name: string
  latitude: number
  longitude: number
  direction: number
  zone: number
}

interface ProcessedService {
  route_number: string
  stop_id: string
  sequence: number
  direction: number
  zone: number
}

// Valid prefixes for stop codes (from process_stops.ts)
const VALID_PREFIXES = [
  'KL',
  'PJ',
  'SJ',
  'SA',
  'SL',
  'SP',
  'AJ',
  'KS',
  'LG',
  'KJ',
  'PPJ',
  'BD',
]

function generateStopId(lat: number, lng: number): string {
  const latStr = Math.abs(lat).toFixed(6).replace('.', '')
  const lngStr = Math.abs(lng).toFixed(6).replace('.', '')
  return `${lat >= 0 ? 'N' : 'S'}${latStr}${lng >= 0 ? 'E' : 'W'}${lngStr}`
}

function extractStopInfo(
  stopName: string,
): { code: string | null; name: string } {
  if (!stopName) return { code: null, name: stopName }

  stopName = stopName.trim()
  const prefixPattern = `(${VALID_PREFIXES.join('|')})[\\s-]*(\\d+)`
  const match = stopName.match(new RegExp(prefixPattern))

  if (match) {
    const [, prefix, number] = match
    const code = `${prefix}${number}`
    let cleanName = stopName
      .replace(new RegExp(`${prefix}[\\s-]*${number}\\s*`), '')
      .trim()
      .replace(/^[\s,\-]+|[\s,\-]+$/g, '')

    return { code, name: cleanName || stopName }
  }

  if (stopName.match(new RegExp(`^(${VALID_PREFIXES.join('|')})\\d+$`))) {
    return { code: stopName, name: stopName }
  }

  return { code: null, name: stopName }
}

function shouldSkipRoute(routeNumber: string): boolean {
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

async function processData() {
  const dataDir = path.join(process.cwd(), 'src/data/raw')
  const outputDir = path.join(process.cwd(), 'src/data/processed')

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Process Stops
  const stopsContent = fs.readFileSync(
    path.join(dataDir, 'all_bus_stops.csv'),
    'utf-8',
  )

  const rawStops = parse(stopsContent, {
    columns: true,
    skip_empty_lines: true,
  }) as RawStop[]

  const stopsMap = new Map<string, ProcessedStop>()
  const oldToNewStopIds = new Map<string, string>()

  rawStops.forEach((rawStop) => {
    const lat = parseFloat(rawStop.latitude)
    const lng = parseFloat(rawStop.longitude)
    const stopId = generateStopId(lat, lng)

    // Store mapping of old to new IDs
    oldToNewStopIds.set(rawStop.stop_id, stopId)

    const stopInfo = extractStopInfo(rawStop.stop_name)
    const codeFromId = extractStopInfo(rawStop.stop_id)
    const stopCode = stopInfo.code || codeFromId.code || ''

    const processedStop: ProcessedStop = {
      stop_id: stopId,
      stop_code: stopCode,
      stop_name: cleanStopName(stopInfo.name),
      street_name: cleanStreetName(rawStop.street_name?.trim() || ''),
      latitude: lat,
      longitude: lng,
      direction: parseInt(rawStop.direction) || 0,
      zone: parseInt(rawStop.zone) || 0,
    }

    stopsMap.set(stopId, processedStop)
  })

  const uniqueStops = Array.from(stopsMap.values()).sort((a, b) =>
    a.stop_id.localeCompare(b.stop_id),
  )

  // Extract services from the same data
  const servicesMap = new Map<string, ProcessedService[]>()

  rawStops.forEach((stop) => {
    if (!stop.route_number || shouldSkipRoute(stop.route_number)) return // Skip empty or filtered routes

    const service: ProcessedService = {
      route_number: stop.route_number,
      stop_id: oldToNewStopIds.get(stop.stop_id) || stop.stop_id, // Use the new coordinate-based ID
      sequence: 0, // We'll set this after grouping
      direction: parseInt(stop.direction) || 0,
      zone: parseInt(stop.zone) || 0,
    }

    const key = `${stop.route_number}-${stop.direction}`
    if (!servicesMap.has(key)) {
      servicesMap.set(key, [])
    }
    servicesMap.get(key)?.push(service)
  })

  // Process sequences for each route+direction
  const processedServices: ProcessedService[] = []
  servicesMap.forEach((stops, key) => {
    // Sort stops by their order in the file (implicit sequence)
    stops.forEach((service, index) => {
      processedServices.push({
        ...service,
        sequence: index + 1,
      })
    })
  })

  // Sort services by route number and sequence
  processedServices.sort((a, b) => {
    const routeCompare = a.route_number.localeCompare(b.route_number)
    return routeCompare !== 0 ? routeCompare : a.sequence - b.sequence
  })

  // Write processed stops
  const stopsOutput = stringify(uniqueStops, {
    header: true,
    columns: [
      'stop_id',
      'stop_code',
      'stop_name',
      'street_name',
      'latitude',
      'longitude',
      'direction',
      'zone',
    ],
  })
  fs.writeFileSync(path.join(outputDir, 'stops.csv'), stopsOutput)

  // Write processed services
  const servicesOutput = stringify(processedServices, {
    header: true,
    columns: ['route_number', 'stop_id', 'sequence', 'direction', 'zone'],
  })
  fs.writeFileSync(path.join(outputDir, 'services.csv'), servicesOutput)

  // Write SQL-friendly JSONs
  const timestamp = new Date().toISOString()
  const dbStops = uniqueStops.map((stop) => ({
    ...stop,
    created_at: timestamp,
    updated_at: timestamp,
  }))

  const dbServices = processedServices.map((service) => ({
    ...service,
    created_at: timestamp,
    updated_at: timestamp,
  }))

  fs.writeFileSync(
    path.join(outputDir, 'stops.json'),
    JSON.stringify(dbStops, null, 2),
  )

  fs.writeFileSync(
    path.join(outputDir, 'services.json'),
    JSON.stringify(dbServices, null, 2),
  )

  console.log(`Processed ${uniqueStops.length} unique stops`)
  console.log(`Processed ${processedServices.length} service entries`)
}

processData().catch(console.error)
