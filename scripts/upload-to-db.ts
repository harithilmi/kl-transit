import 'dotenv/config'
import { db } from '~/server/db'
import { stops, services, routes } from '~/server/db/schema'
import fs from 'fs'
import path from 'path'
import { eq, and } from 'drizzle-orm'
import routesData from '../src/data/raw/routes.json'

async function uploadData() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set')
  }

  const dataDir = path.join(process.cwd(), 'src/data/processed')
  
  // Read processed data
  const stopsData = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'stops.json'), 'utf-8')
  )
  const servicesData = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'services.json'), 'utf-8')
  )

  console.log('Uploading stops...')
  
  // Upload or update stops
  for (const stop of stopsData) {
    try {
      const existing = await db.query.stops.findFirst({
        where: eq(stops.stopId, stop.stop_id)
      })

      if (existing) {
        await db.update(stops)
          .set({
            stopCode: stop.stop_code,
            stopName: stop.stop_name,
            streetName: stop.street_name,
            latitude: stop.latitude,
            longitude: stop.longitude,
          })
          .where(eq(stops.stopId, stop.stop_id))
      } else {
        await db.insert(stops).values({
          stopId: stop.stop_id,
          stopCode: stop.stop_code,
          stopName: stop.stop_name,
          streetName: stop.street_name,
          latitude: stop.latitude,
          longitude: stop.longitude,
        })
      }
    } catch (error) {
      console.error(`Error processing stop ${stop.stop_id}:`, error)
    }
  }

  console.log('Uploading routes...')
  
  // Upload or update routes
  for (const [routeNumber, routeInfo] of Object.entries(routesData)) {
    try {
      const existing = await db.query.routes.findFirst({
        where: eq(routes.routeNumber, routeNumber)
      })

      if (existing) {
        await db.update(routes)
          .set({
            routeName: routeInfo.route_name,
            routeType: routeInfo.route_type,
          })
          .where(eq(routes.routeNumber, routeNumber))
      } else {
        await db.insert(routes).values({
          routeNumber: routeNumber,
          routeName: routeInfo.route_name,
          routeType: routeInfo.route_type,
        })
      }
    } catch (error) {
      console.error(`Error processing route ${routeNumber}:`, error)
    }
  }

  console.log('Uploading services...')
  
  // Upload or update services
  for (const service of servicesData) {
    try {
      const existing = await db.query.services.findFirst({
        where: and(
          eq(services.stopId, service.stop_id),
          eq(services.routeNumber, service.route_number)
        )
      })

      if (existing) {
        await db.update(services)
          .set({
            direction: service.direction,
            zone: service.zone,
            sequence: service.sequence,
          })
          .where(and(
            eq(services.stopId, service.stop_id),
            eq(services.routeNumber, service.route_number)
          ))
      } else {
        await db.insert(services).values({
          routeNumber: service.route_number,
          stopId: service.stop_id,
          direction: service.direction,
          zone: service.zone,
          sequence: service.sequence,
        })
      }
    } catch (error) {
      console.error(`Error processing service for stop ${service.stop_id}, route ${service.route_number}:`, error)
    }
  }

  console.log('Upload complete!')
}

uploadData().catch(console.error) 