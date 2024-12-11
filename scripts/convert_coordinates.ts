import fs from 'fs'
import path from 'path'

// Read the JSON file
const inputPath = path.join(
  process.cwd(),
  'src/data/from_db/kl-transit_stop.json',
)
const outputPath = path.join(
  process.cwd(),
  'src/data/from_db/kl-transit_stop_converted.json',
)

// Read and parse the JSON file
const stops = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))

// Convert coordinates to numbers
const convertedStops = stops.map((stop: any) => ({
  ...stop,
  latitude: parseFloat(stop.latitude),
  longitude: parseFloat(stop.longitude),
}))

// Write the converted data back to a new file
fs.writeFileSync(outputPath, JSON.stringify(convertedStops, null, 2), 'utf-8')

console.log(
  'Conversion complete! New file saved as kl-transit_stop_converted.json',
)
