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
import { relations } from 'drizzle-orm'

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
    routeId: varchar('route_id', { length: 50 }).notNull().unique(),
    agencyId: varchar('agency_id', { length: 50 }).notNull(),
    routeShortName: varchar('route_short_name', { length: 50 }).notNull(),
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

export const stops = createTable(
  'stop',
  {
    id: serial('id').primaryKey(),
    stopId: varchar('stop_id', { length: 10 }).notNull().unique(),
    stopName: varchar('stop_name', { length: 100 }).notNull(),
    stopDesc: varchar('stop_desc', { length: 100 }),
    stopLat: varchar('stop_lat', { length: 20 }).notNull(),
    stopLon: varchar('stop_lon', { length: 20 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (stops) => ({
    stopIdIndex: index('stop_id_idx').on(stops.stopId),
  }),
)

//stops.csv
// stop_id,stop_name,stop_desc,stop_lat,stop_lon
// 1004342,KL1821 PASAR SENI (PLATFORM A1 - A2),JSM,3.142834,101.6956
// 1001672,KL112 KOTA RAYA,JLN TUN TAN CHENG LOCK,3.1454957091436,101.69812709966
// 1002080,KL113 HAB LEBUH PUDU,JLN TUN PERAK,3.146744,101.698695

export const routeStops = createTable(
  'route_stop',
  {
    id: serial('id').primaryKey(),
    routeId: varchar('route_id', { length: 50 })
      .notNull()
      .references(() => routes.routeId),
    stopId: varchar('stop_id', { length: 10 })
      .notNull()
      .references(() => stops.stopId),
    sequence: integer('sequence').notNull(),
    headsign: varchar('headsign', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (routeStops) => ({
    routeStopIndex: index('route_stop_idx').on(
      routeStops.routeId,
      routeStops.stopId,
    ),
    sequenceIndex: index('sequence_idx').on(
      routeStops.routeId,
      routeStops.sequence,
    ),
  }),
)

// route_id stop_id stop_sequence stop_headsign
// 1004342	1	Kompleks Mahkamah Jalan Duta
// 1001672	2	Kompleks Mahkamah Jalan Duta
// 1002080	3	Kompleks Mahkamah Jalan Duta
// 1001810	4	Kompleks Mahkamah Jalan Duta
// 1000230	5	Kompleks Mahkamah Jalan Duta
// 1001070	6	Kompleks Mahkamah Jalan Duta
// 1001411	7	Kompleks Mahkamah Jalan Duta
// 1001173	8	Kompleks Mahkamah Jalan Duta
// 1001171	9	Kompleks Mahkamah Jalan Duta
// 1000313	10	Kompleks Mahkamah Jalan Duta
// 1000597	11	Kompleks Mahkamah Jalan Duta
// 1001099	12	Kompleks Mahkamah Jalan Duta
// 1001101	13	Kompleks Mahkamah Jalan Duta
// 1001957	14	Kompleks Mahkamah Jalan Duta
// 1001623	15	Pasar Seni
// 1002010	16	Pasar Seni
// 1001116	17	Pasar Seni
// 1001958	18	Pasar Seni
// 1007469	19	Pasar Seni
// 1001100	20	Pasar Seni
// 1001375	21	Pasar Seni
// 1000598	22	Pasar Seni
// 1001172	23	Pasar Seni
// 1001071	24	Pasar Seni
// 1000488	25	Pasar Seni
// 1001183	26	Pasar Seni
// 1001673	27	Pasar Seni
// 1004342	28	Pasar Seni

// Define relations for routes
export const routesRelations = relations(routes, ({ many }) => ({
  routeStops: many(routeStops),
}))

// Define relations for stops
export const stopsRelations = relations(stops, ({ many }) => ({
  routeStops: many(routeStops),
}))

// Define relations for routeStops
export const routeStopsRelations = relations(routeStops, ({ one }) => ({
  route: one(routes, {
    fields: [routeStops.routeId],
    references: [routes.routeId],
  }),
  stop: one(stops, {
    fields: [routeStops.stopId],
    references: [stops.stopId],
  }),
}))
