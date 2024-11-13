import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import type { Service, Stop } from '~/app/types/routes'

// Read CSV files
const dataDir = path.join(process.cwd(), 'src/data/processed')

const servicesFile = fs.readFileSync(
  path.join(dataDir, 'services.csv'),
  'utf-8',
)
const stopsFile = fs.readFileSync(path.join(dataDir, 'stops.csv'), 'utf-8')

// Parse CSV files with proper typing and data transformation
const services = parse(servicesFile, {
  columns: true,
  skip_empty_lines: true,
  cast: (value, context) => {
    switch (context.column) {
      case 'stop_id':
      case 'sequence':
      case 'direction':
      case 'zone':
        return parseInt(value)
      default:
        return value
    }
  },
}) as Service[]

const rawStops = parse(stopsFile, {
  columns: true,
  skip_empty_lines: true,
  cast: (value, context) => {
    switch (context.column) {
      case 'stop_id':
        return parseInt(value)
      case 'latitude':
      case 'longitude':
        return parseFloat(value)
      default:
        return value
    }
  },
}) as Record<string, string | number>[]

// Transform raw stops data to match Stop interface
const stops: Stop[] = rawStops.map((rawStop) => ({
  stop_id: Number(rawStop.stop_id),
  stop_code: String(rawStop.stop_code ?? ''),
  stop_name: String(rawStop.stop_name ?? ''),
  street_name: String(rawStop.street_name ?? ''),
  latitude: Number(rawStop.latitude ?? 0),
  longitude: Number(rawStop.longitude ?? 0),
  stop_name_old: String(rawStop.stop_name_old ?? rawStop.stop_name ?? ''),
  street_name_old: String(rawStop.street_name_old ?? rawStop.street_name ?? ''),
}))

// Create bundled data with proper typing
const bundledData = {
  services,
  stops,
}

// Write to JSON file
fs.writeFileSync(
  path.join(process.cwd(), 'src/data/bundled-data.json'),
  JSON.stringify(bundledData, null, 2),
)

console.log('Bundled data created successfully!')
