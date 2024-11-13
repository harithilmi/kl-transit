import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import type { Service, Stop } from '~/app/types/routes'
import { NAME_RULES } from './name-rules'

function cleanStreetName(street: string): string {
  if (!street) return street

  // Remove leading/trailing spaces
  street = street.trim()

  // Split into words
  const words = street.split(' ')

  // Process each word
  const processedWords = words.map((word) => {
    const wordUpper = word.toUpperCase()
    // Check if it's a street type
    if (wordUpper in NAME_RULES.street_types) {
      return NAME_RULES.street_types[
        wordUpper as keyof typeof NAME_RULES.street_types
      ]
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })

  return processedWords.join(' ')
}

function cleanStopName(name: string): string {
  if (!name) return name

  // Remove leading/trailing spaces
  name = name.trim()

  // Remove prefix like (M), (M1)
  name = name.replace(/\(M\d?\)\s*/g, '')

  function processWord(word: string): string {
    const wordUpper = word.toUpperCase()
    if (NAME_RULES.uppercase.has(wordUpper)) {
      return wordUpper
    }
    if (wordUpper in NAME_RULES.street_types) {
      return NAME_RULES.street_types[
        wordUpper as keyof typeof NAME_RULES.street_types
      ]
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }

  function processBracketedText(match: string, inner: string): string {
    inner = inner.trim()

    // Special case: single letter in brackets should be capitalized
    if (inner.length === 1) {
      return ` (${inner.toUpperCase()}) `
    }

    // Split the inner text and process each word
    const words = inner.split(' ')
    const processedWords = words.map(processWord)
    return ` (${processedWords.join(' ')}) `
  }

  // First process text in brackets
  const processedName = name.replace(/\(([^)]+)\)/g, processBracketedText)

  // Then process the rest of the text
  const parts = processedName.split(/(\s?\([^)]+\)\s?)/)

  const result = parts.map((part) => {
    if (part.includes('(') && part.includes(')')) {
      return part
    } else {
      const subparts = part.split(/([/-])/)
      return subparts
        .map((subpart) => {
          if (subpart === '/' || subpart === '-') return subpart
          return subpart.split(' ').map(processWord).join(' ')
        })
        .join('')
    }
  })

  // Clean up multiple spaces and trim
  return result.join('').replace(/\s+/g, ' ').trim()
}

// Read and parse CSV files
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

// Transform raw stops to match Stop interface
const stops: Stop[] = rawStops.map((rawStop) => ({
  stop_id: Number(rawStop.stop_id),
  stop_code: String(rawStop.stop_code ?? ''),
  stop_name: String(rawStop.stop_name ?? ''),
  street_name: String(rawStop.street_name ?? ''),
  latitude: Number(rawStop.latitude ?? 0),
  longitude: Number(rawStop.longitude ?? 0),
  stop_name_old: String(rawStop.stop_name ?? ''),
  street_name_old: String(rawStop.street_name ?? ''),
}))

// Clean stop names with proper typing
const cleanedStops: Stop[] = stops.map((stop) => ({
  ...stop,
  stop_name_old: stop.stop_name,
  street_name_old: stop.street_name,
  stop_name: cleanStopName(stop.stop_name),
  street_name: cleanStreetName(stop.street_name),
}))

// Create bundled data with proper typing
const bundledData: {
  services: Service[]
  stops: Stop[]
} = {
  services,
  stops: cleanedStops,
}

// Write processed stops back to CSV with proper typing
if (cleanedStops.length === 0) {
  console.log('No stops to process')
  process.exit(0)
}

// Ensure all stop fields are properly quoted in CSV
const csvHeader = [
  'stop_id',
  'stop_code',
  'stop_name',
  'street_name',
  'latitude',
  'longitude',
  'stop_name_old',
  'street_name_old',
].join(',')

const csvRows = cleanedStops.map((stop) => {
  const values = [
    stop.stop_id,
    stop.stop_code,
    stop.stop_name,
    stop.street_name,
    stop.latitude,
    stop.longitude,
    stop.stop_name_old,
    stop.street_name_old,
  ]
  return values.map((value) => `"${value}"`).join(',')
})

const csvContent = [csvHeader, ...csvRows].join('\n')

fs.writeFileSync(path.join(dataDir, 'stops.csv'), csvContent)

// Write bundled data to JSON
fs.writeFileSync(
  path.join(process.cwd(), 'src/data/bundled-data.json'),
  JSON.stringify(bundledData, null, 2),
)

console.log('Data processing completed successfully!')
