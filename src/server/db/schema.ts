import { sql } from 'drizzle-orm'
import {
  index,
  pgTableCreator,
  serial,
  timestamp,
  varchar,
  decimal,
  jsonb,
} from 'drizzle-orm/pg-core'

export const createTable = pgTableCreator((name) => `kl-transit_${name}`)

export const stopSuggestionBatches = createTable('stop_suggestion_batch', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})

export const stopSuggestions = createTable(
  'stop_suggestion',
  {
    id: serial('id').primaryKey(),
    batchId: serial('batch_id')
      .references(() => stopSuggestionBatches.id)
      .notNull(),
    userId: varchar('user_id', { length: 100 }).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(),
    temporaryId: varchar('temporary_id', { length: 50 }),
    stopCode: varchar('stop_code', { length: 20 }),
    stopName: varchar('stop_name', { length: 100 }),
    streetName: varchar('street_name', { length: 100 }),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    stopId: varchar('stop_id', { length: 50 }),
    rapidStopId: decimal('rapid_stop_id', { precision: 10, scale: 0 }),
    mrtStopId: decimal('mrt_stop_id', { precision: 10, scale: 0 }),
    changes: jsonb('changes').notNull(),
    type: varchar('type', { length: 20 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (suggestions) => ({
    userIdx: index('user_stop_suggestion_idx').on(suggestions.userId),
    stopIdx: index('stop_suggestion_idx').on(suggestions.stopId),
    statusIdx: index('stop_suggestion_status_idx').on(suggestions.status),
    tempIdIdx: index('temporary_id_idx').on(suggestions.temporaryId),
    typeIdx: index('suggestion_type_idx').on(suggestions.type),
    batchIdx: index('batch_id_idx').on(suggestions.batchId),
  }),
)

// Types for stop suggestions
export type StopSuggestionType = 'new' | 'edit' | 'delete'

export type StopSuggestionStatus = 'pending' | 'approved' | 'rejected'

export interface StopChanges {
  stop_code?: string
  stop_name?: string
  street_name?: string
  latitude?: number
  longitude?: number
  rapid_stop_id?: number | null
  mrt_stop_id?: number | null
}

export interface StopSuggestionBatch {
  id: number
  userId: string
  status: StopSuggestionStatus
  createdAt: Date
  updatedAt: Date
}

export interface StopSuggestion {
  id: number
  batchId: number
  userId: string
  status: StopSuggestionStatus
  temporaryId?: string
  stopCode?: string
  stopName?: string
  streetName?: string
  latitude?: number
  longitude?: number
  stopId?: string
  rapidStopId?: number
  mrtStopId?: number
  changes: StopChanges
  type: StopSuggestionType
  createdAt: Date
  updatedAt: Date
}

// Trip suggestion schema
export const tripSuggestionBatches = createTable('trip_suggestion_batch', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})

export const tripSuggestions = createTable(
  'trip_suggestion',
  {
    id: serial('id').primaryKey(),
    batchId: serial('batch_id')
      .references(() => tripSuggestionBatches.id)
      .notNull(),
    userId: varchar('user_id', { length: 100 }).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(),
    tripId: decimal('trip_id', { precision: 10, scale: 0 }).notNull(),
    routeId: decimal('route_id', { precision: 10, scale: 0 }).notNull(),
    changes: jsonb('changes').notNull(),
    type: varchar('type', { length: 20 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (suggestions) => ({
    userIdx: index('user_trip_suggestion_idx').on(suggestions.userId),
    tripIdx: index('trip_suggestion_idx').on(suggestions.tripId),
    statusIdx: index('trip_suggestion_status_idx').on(suggestions.status),
    typeIdx: index('trip_suggestion_type_idx').on(suggestions.type),
    batchIdx: index('trip_batch_id_idx').on(suggestions.batchId),
  }),
)

// Types for trip suggestions
export type TripSuggestionType = 'edit'

export interface TripChanges {
  stopDetails: Array<{
    stopId: number
    fareZone: number
  }>
  stopPairSegments?: Array<{
    fromStopId: number
    toStopId: number
    distance: number | null
    segmentShape: string | null // encoded polyline
  }>
}

export interface TripSuggestionBatch {
  id: number
  userId: string
  status: StopSuggestionStatus
  createdAt: Date
  updatedAt: Date
}

export interface TripSuggestion {
  id: number
  batchId: number
  userId: string
  status: StopSuggestionStatus
  tripId: number
  routeId: number
  changes: TripChanges
  type: TripSuggestionType
  createdAt: Date
  updatedAt: Date
}
