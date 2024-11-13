import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import type { Service, Stop, RouteStopWithData } from '~/app/types/routes'

// Read CSV files
const dataDir = path.join(process.cwd(), 'src/data/processed')

const servicesFile = fs.readFileSync(
  path.join(dataDir, 'services.csv'),
  'utf-8',
)
const stopsFile = fs.readFileSync(path.join(dataDir, 'stops.csv'), 'utf-8')

// Parse CSV files with proper typing
const services = parse(servicesFile, {
  columns: true,
  skip_empty_lines: true,
  cast: (value, context) => {
    if (context.column === 'sequence') {
      return parseInt(value)
    }
    return value
  },
}) as Service[]

const stops = parse(stopsFile, {
  columns: true,
  skip_empty_lines: true,
}) as Stop[]

// Create bundled data with proper typing
const bundledData: {
  services: Service[]
  stops: Stop[]
} = {
  services,
  stops,
}

// Write to JSON file
fs.writeFileSync(
  path.join(process.cwd(), 'src/data/bundled-data.json'),
  JSON.stringify(bundledData, null, 2),
)

console.log('Bundled data created successfully!')
