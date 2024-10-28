import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { stops, routes, trips, stopTimes } from '../server/db/schema'
import Papa from 'papaparse'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (!process.env.POSTGRES_URL_NON_POOLING) {
  throw new Error(
    'POSTGRES_URL_NON_POOLING is not set in environment variables',
  )
}

const client = postgres(process.env.POSTGRES_URL_NON_POOLING)
const db = drizzle(client)

async function importCSV(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Filter out rows with missing required fields
        const validRows = results.data.filter((row) => {
          const hasAllFields = Object.values(row).every(
            (value) => value !== null && value !== undefined && value !== '',
          )
          if (!hasAllFields) {
            console.log('Skipping invalid row:', row)
          }
          return hasAllFields
        })
        resolve(validRows)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

async function main() {
  try {
    // Get the correct path to data directory (one level up from scripts)
    const dataDir = path.join(__dirname, '..', 'data')

    // Import stop times (if you have stop_times.txt)
    const stopTimesPath = path.join(dataDir, 'stop_times.txt')
    if (fs.existsSync(stopTimesPath)) {
      const stopTimesData = await importCSV(stopTimesPath)
      await db.insert(stopTimes).values(
        stopTimesData.map((stopTime) => ({
          tripId: stopTime.trip_id,
          arrivalTime: stopTime.arrival_time,
          departureTime: stopTime.departure_time,
          stopId: stopTime.stop_id,
          stopSequence: parseInt(stopTime.stop_sequence),
          stopHeadsign: stopTime.stop_headsign,
        })),
      )
      console.log('Imported stop times data')
    }
  } catch (error) {
    console.error('Error importing data:', error)
  } finally {
    await client.end()
  }
}

main()
