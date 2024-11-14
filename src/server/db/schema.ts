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
  decimal,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `kl-transit_${name}`)

export const stops = createTable(
  'stop',
  {
    id: serial('id').primaryKey(),
    stopId: varchar('stop_id', { length: 50 }).notNull().unique(),
    stopCode: varchar('stop_code', { length: 20 }),
    stopName: varchar('stop_name', { length: 100 }).notNull(),
    streetName: varchar('street_name', { length: 100 }),
    latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
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

export const services = createTable(
  'service',
  {
    id: serial('id').primaryKey(),
    routeNumber: varchar('route_number', { length: 20 }).notNull(),
    stopId: varchar('stop_id', { length: 50 })
      .notNull()
      .references(() => stops.stopId),
    direction: integer('direction').notNull(),
    zone: integer('zone').notNull(),
    sequence: integer('sequence').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (services) => ({
    routeStopIndex: index('route_stop_idx').on(
      services.routeNumber,
      services.stopId,
    ),
    sequenceIndex: index('sequence_idx').on(
      services.routeNumber,
      services.sequence,
    ),
  }),
)

export const routes = createTable(
  'route',
  {
    id: serial('id').primaryKey(),
    routeNumber: varchar('route_number', { length: 20 }).notNull().unique(),
    routeName: varchar('route_name', { length: 200 }).notNull(),
    routeType: varchar('route_type', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (routes) => ({
    routeNumberIndex: index('route_number_idx').on(routes.routeNumber),
  }),
)

// Define relations
export const stopsRelations = relations(stops, ({ many }) => ({
  services: many(services),
}))

export const servicesRelations = relations(services, ({ one }) => ({
  stop: one(stops, {
    fields: [services.stopId],
    references: [stops.stopId],
  }),
  route: one(routes, {
    fields: [services.routeNumber],
    references: [routes.routeNumber],
  }),
}))

export const routesRelations = relations(routes, ({ many }) => ({
  services: many(services),
}))
