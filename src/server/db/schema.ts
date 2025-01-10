import {
  pgTable,
  uniqueIndex,
  integer,
  text,
  serial,
  index,
  varchar,
  jsonb,
  timestamp,
  boolean,
  real,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ------------------------------------------------------------
// kl_transit_routes
// ------------------------------------------------------------
export const kl_transit_routes = pgTable(
  'kl_transit_routes',
  {
    route_id: integer('route_id').primaryKey().notNull(),
    route_short_name: text('route_short_name').notNull(),
    route_long_name: text('route_long_name').notNull(),
    operator_id: text('operator_id'),
    network_id: text('network_id'),
    route_color: text('route_color'),
    route_text_color: text('route_text_color'),
    route_type: real('route_type'),
  },
  (table) => [uniqueIndex('kl_transit_routes_pkey').on(table.route_id)],
)

// ------------------------------------------------------------
// kl_transit_stops
// ------------------------------------------------------------
export const kl_transit_stops = pgTable(
  'kl_transit_stops',
  {
    stop_id: serial('stop_id').primaryKey().notNull(),
    stop_name: text('stop_name').notNull(),
    stop_code: text('stop_code'),
    street_name: text('street_name'),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    rapid_stop_id: real('rapid_stop_id'),
    mrt_stop_id: real('mrt_stop_id'),
    old_stop_id: text('old_stop_id'),
  },
  (table) => [uniqueIndex('kl_transit_stops_pkey').on(table.stop_id)],
)

// ------------------------------------------------------------
// kl_transit_stop_pair_segments
// ------------------------------------------------------------
export const kl_transit_stop_pair_segments = pgTable(
  'kl_transit_stop_pair_segments',
  {
    id: serial('id').primaryKey().notNull(),
    from_stop_id: integer('from_stop_id')
      .notNull()
      .references(() => kl_transit_stops.stop_id, { onDelete: 'cascade' }),
    to_stop_id: integer('to_stop_id')
      .notNull()
      .references(() => kl_transit_stops.stop_id, { onDelete: 'cascade' }),
    distance: real('distance'),
    segment_shape: text('segment_shape'),
  },
  (table) => [
    uniqueIndex('kl_transit_stop_pair_segments_pkey').on(table.id),
    uniqueIndex('stop_pair_segments_from_to_idx').on(
      table.from_stop_id,
      table.to_stop_id,
    ),
  ],
)

// ------------------------------------------------------------
// kl_transit_trip_stops
// ------------------------------------------------------------
export const kl_transit_trip_stops = pgTable(
  'kl_transit_trip_stops',
  {
    id: serial('id').primaryKey().notNull(),
    trip_id: integer('trip_id')
      .notNull()
      .references(() => kl_transit_trips.trip_id, { onDelete: 'cascade' }),
    stop_id: integer('stop_id')
      .notNull()
      .references(() => kl_transit_stops.stop_id, { onDelete: 'cascade' }),
    fare_zone: integer('fare_zone')
      .default(sql`1`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('kl_transit_trip_stops_pkey').on(table.id),
    index('trip_stops_composite_idx').on(table.trip_id, table.stop_id),
  ],
)

// ------------------------------------------------------------
// kl_transit_trips
// ------------------------------------------------------------
export const kl_transit_trips = pgTable(
  'kl_transit_trips',
  {
    trip_id: integer('trip_id').primaryKey().notNull(),
    route_id: integer('route_id')
      .notNull()
      .references(() => kl_transit_routes.route_id, { onDelete: 'cascade' }),
    headsign: text('headsign'),
    direction: integer('direction'),
    is_active: boolean('is_active').notNull(),
    full_shape: text('full_shape'),
  },
  (table) => [uniqueIndex('kl_transit_trips_pkey').on(table.trip_id)],
)

// ------------------------------------------------------------
// kl_transit_stop_change_logs
// ------------------------------------------------------------
export const kl_transit_stop_change_logs = pgTable(
  'kl_transit_stop_change_logs',
  {
    id: serial('id').primaryKey().notNull(),
    user_id: varchar('user_id', { length: 50 }).notNull(),
    stop_id: integer('stop_id')
      .notNull()
      .references(() => kl_transit_stops.stop_id, { onDelete: 'cascade' }),
    change_type: varchar('change_type', { length: 20 }).notNull(),
    changes: jsonb('changes'),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
)
