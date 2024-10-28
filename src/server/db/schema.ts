// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from 'drizzle-orm'
import {
  index,
  pgTableCreator,
  serial,
  timestamp,
  varchar,
  integer,
} from 'drizzle-orm/pg-core'

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `kl-transit_${name}`)

export const routes = createTable(
  'route',
  {
    id: serial('id').primaryKey(),
    routeId: varchar('route_id', { length: 10 }).notNull().unique(),
    agencyId: varchar('agency_id', { length: 50 }).notNull(),
    routeShortName: varchar('route_short_name', { length: 10 }).notNull(),
    routeLongName: varchar('route_long_name', { length: 100 }).notNull(),
    routeType: integer('route_type').notNull(),
    routeColor: varchar('route_color', { length: 6 }).notNull(),
    routeTextColor: varchar('route_text_color', { length: 6 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (routes) => ({
    routeIdIndex: index('route_id_idx').on(routes.routeId),
    routeShortNameIndex: index('route_short_name_idx').on(
      routes.routeShortName,
    ),
  }),
)

// routes.csv
// route_id,agency_id,route_short_name,route_long_name,route_type,route_color,route_text_color
// U3000,rapidkl,300,Hab Pandan Indah ~ Lebuh Ampang,3,006CFF,FFFFFF
// U3030,rapidkl,303,Taman Mulia Jaya ~ Lebuh Ampang,3,006CFF,FFFFFF

export const stops = createTable('stop', {
  id: serial('id').primaryKey(),
  stopId: varchar('stop_id', { length: 10 }).notNull().unique(),
  stopName: varchar('stop_name', { length: 100 }).notNull(),
  stopDesc: varchar('stop_desc', { length: 100 }).notNull(),
  stopLat: varchar('stop_lat', { length: 20 }).notNull(),
  stopLon: varchar('stop_lon', { length: 20 }).notNull(),
})

//stops.csv
// stop_id,stop_name,stop_desc,stop_lat,stop_lon
// 1004342,KL1821 PASAR SENI (PLATFORM A1 - A2),JSM,3.142834,101.6956
// 1001672,KL112 KOTA RAYA,JLN TUN TAN CHENG LOCK,3.1454957091436,101.69812709966
// 1002080,KL113 HAB LEBUH PUDU,JLN TUN PERAK,3.146744,101.698695

export const stopTimes = createTable('stop_time', {
  id: serial('id').primaryKey(),
  tripId: varchar('trip_id', { length: 10 }).notNull(),
  arrivalTime: varchar('arrival_time', { length: 10 }).notNull(),
  departureTime: varchar('departure_time', { length: 10 }).notNull(),
  stopId: varchar('stop_id', { length: 10 }).notNull(),
  stopSequence: integer('stop_sequence').notNull(),
  stopHeadsign: varchar('stop_headsign', { length: 100 }).notNull(),
})

// 	trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign
// weekend_U8510_U851002_0,06:30:00,06:30:00,1004342,1,Kompleks Mahkamah Jalan Duta
// weekend_U8510_U851002_0,06:30:24,06:30:24,1001672,2,Kompleks Mahkamah Jalan Duta
// weekend_U8510_U851002_0,06:30:40,06:30:40,1002080,3,Kompleks Mahkamah Jalan Duta
// weekend_U8510_U851002_0,06:31:01,06:31:01,1001810,4,Kompleks Mahkamah Jalan Duta
// weekend_U8510_U851002_0,06:31:41,06:31:41,1000230,5,Kompleks Mahkamah Jalan Duta
// weekend_U8510_U851002_0,06:31:54,06:31:54,1001070,6,Kompleks Mahkamah Jalan Duta
// weekend_U8510_U851002_0,06:32:14,06:32:14,1001411,7,Kompleks Mahkamah Jalan Duta

export const trips = createTable('trip', {
  id: serial('id').primaryKey(),
  routeId: varchar('route_id', { length: 10 }).notNull(),
  serviceId: varchar('service_id', { length: 10 }).notNull(),
  tripId: varchar('trip_id', { length: 10 }).notNull(),
  shapeId: varchar('shape_id', { length: 10 }).notNull(),
  tripHeadsign: varchar('trip_headsign', { length: 100 }).notNull(),
  directionId: integer('direction_id').notNull(),
})

// route_id,service_id,trip_id,shape_id,trip_headsign,direction_id
// U8510,weekend,weekend_U8510_U851002_0,U851002,,0
// S0100,weekday,weekday_S0100_S010002_0,S010002,,0
// S0100,weekend,weekend_S0100_S010002_0,S010002,,0
// T7570,weekday,weekday_T7570_T757002_0,T757002,,0
// T7570,weekday,weekday_T7570_T757002_1,T757002,,0
// T7570,weekday,weekday_T7570_T757002_2,T757002,,0
// T7570,weekday,weekday_T7570_T757002_3,T757002,,0
// T7570,weekday,weekday_T7570_T757002_4,T757002,,0
