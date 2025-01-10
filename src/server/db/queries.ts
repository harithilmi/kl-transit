import { and, eq, ilike, inArray, sql } from 'drizzle-orm'
import { db } from '@/server/db'
import {
  kl_transit_routes,
  kl_transit_trips,
  kl_transit_trip_stops,
  kl_transit_stops,
  kl_transit_stop_pair_segments,
} from '@/server/db/schema'
import type { Route, Trip } from '@/types/routes'
import { type InferSelectModel } from 'drizzle-orm'

export type Stop = InferSelectModel<typeof kl_transit_stops> 


export const routeQueries = {
  // --------------------------------------------------------
  // 1) Get ALL stops
  // --------------------------------------------------------
  async getStops(): Promise<Stop[]> {
    return db
		.select()
      .from(kl_transit_stops)
  },

  // --------------------------------------------------------
  // 2) Get ALL routes (with optional search), plus trips
  // --------------------------------------------------------
  async getRoutes(search?: string) {
    // Single query with all joins
    const routesWithTrips = await db
      .select({
        route: kl_transit_routes,
        trip: kl_transit_trips,
        stopDetails: kl_transit_trip_stops,
        stopPairSegments: kl_transit_stop_pair_segments,
      })
      .from(kl_transit_routes)
      .innerJoin(
        kl_transit_trips,
        and(
          eq(kl_transit_trips.route_id, kl_transit_routes.route_id),
          eq(kl_transit_trips.is_active, true)
        )
      )
      .leftJoin(
        kl_transit_trip_stops,
        eq(kl_transit_trip_stops.trip_id, kl_transit_trips.trip_id)
      )
      .leftJoin(
        kl_transit_stop_pair_segments,
        and(
          eq(kl_transit_stop_pair_segments.from_stop_id, kl_transit_trip_stops.stop_id),
          eq(kl_transit_stop_pair_segments.to_stop_id, sql`lead(${kl_transit_trip_stops.stop_id}) over (partition by ${kl_transit_trips.trip_id} order by ${kl_transit_trip_stops.id})`)
        )
      )
      .where(search ? ilike(kl_transit_routes.route_short_name, `%${search}%`) : undefined)
      .orderBy(kl_transit_routes.route_short_name);

    // Group and transform the results
    const groupedRoutes = new Map();
    
    for (const row of routesWithTrips) {
      const { route, trip, stopDetails, stopPairSegments } = row;
      
      if (!groupedRoutes.has(route.route_id)) {
        groupedRoutes.set(route.route_id, {
          ...route,
          trips: new Map(),
        });
      }
      
      const routeEntry = groupedRoutes.get(route.route_id);
      if (!routeEntry.trips.has(trip.trip_id)) {
        routeEntry.trips.set(trip.trip_id, {
          ...trip,
          stopDetails: [],
          stopPairSegments: [],
        });
      }
      
      if (stopDetails) {
        routeEntry.trips.get(trip.trip_id).stopDetails.push({
          stop_id: stopDetails.stop_id,
          fare_zone: stopDetails.fare_zone,
        });
      }
      
      if (stopPairSegments) {
        routeEntry.trips.get(trip.trip_id).stopPairSegments.push({
          fromStopId: stopPairSegments.from_stop_id,
          toStopId: stopPairSegments.to_stop_id,
          distance: stopPairSegments.distance ? Number(stopPairSegments.distance) : null,
          segmentShape: stopPairSegments.segment_shape,
        });
      }
    }

    return Array.from(groupedRoutes.values()).map(route => ({
      ...route,
      trips: Array.from(route.trips.values()),
    }));
  },

  // --------------------------------------------------------
  // 3) Get a single route + all its trips/stops
  // --------------------------------------------------------
  async getRoute(routeId: number): Promise<Route | null> {
    const routeWithTrips = await db
      .select({
        route: kl_transit_routes,
        trip: kl_transit_trips,
        stopDetails: {
          trip_id: kl_transit_trip_stops.trip_id,
          stop_id: kl_transit_stops.stop_id,
          fare_zone: kl_transit_trip_stops.fare_zone,
          id: kl_transit_trip_stops.id,
        },
      })
      .from(kl_transit_routes)
      .leftJoin(
        kl_transit_trips,
        eq(kl_transit_trips.route_id, kl_transit_routes.route_id)
      )
      .leftJoin(
        kl_transit_trip_stops,
        eq(kl_transit_trip_stops.trip_id, kl_transit_trips.trip_id)
      )
      .leftJoin(
        kl_transit_stops,
        eq(kl_transit_stops.stop_id, kl_transit_trip_stops.stop_id)
      )
      .where(eq(kl_transit_routes.route_id, routeId));

    if (!routeWithTrips.length) return null;

    // Get stop pair segments separately
    const stopIds = routeWithTrips
      .filter(row => row.stopDetails?.stop_id)
      .map(row => row.stopDetails.stop_id);

    const stopPairSegments = await db
      .select()
      .from(kl_transit_stop_pair_segments)
      .where(
        and(
          inArray(kl_transit_stop_pair_segments.from_stop_id, stopIds),
          inArray(kl_transit_stop_pair_segments.to_stop_id, stopIds)
        )
      );

    // Group by route and trips
    const route = routeWithTrips[0].route;
    const tripsMap = new Map();

    for (const row of routeWithTrips) {
      const { trip, stopDetails } = row;
      if (!trip || !stopDetails) continue;

      if (!tripsMap.has(trip.trip_id)) {
        tripsMap.set(trip.trip_id, {
          ...trip,
          stopDetails: [],
          stopPairSegments: [],
        });
      }

      const currentTrip = tripsMap.get(trip.trip_id);
      if (!currentTrip) continue;

      currentTrip.stopDetails.push({
        stop_id: stopDetails.stop_id,
        fare_zone: stopDetails.fare_zone,
      });
    }

    // Add stop pair segments to trips
    for (const trip of tripsMap.values()) {
      trip.stopPairSegments = stopPairSegments
        .filter(seg => 
          trip.stopDetails.some((s, i) => 
            s.stop_id === seg.from_stop_id && 
            trip.stopDetails[i + 1]?.stop_id === seg.to_stop_id
          )
        )
        .map(seg => ({
          fromStopId: seg.from_stop_id,
          toStopId: seg.to_stop_id,
          distance: seg.distance ? Number(seg.distance) : null,
          segmentShape: seg.segment_shape,
        }));
    }

    return {
      ...route,
      trips: Array.from(tripsMap.values()),
    };
  },

  // --------------------------------------------------------
  // 4) Get a single trip
  // --------------------------------------------------------
  async getTrip(tripId: number): Promise<Trip | null> {
    const trip = await db.query.kl_transit_trips.findFirst({
      where: eq(kl_transit_trips.trip_id, tripId),
    })
    if (!trip) return null

    // Stop details
    const stopDetails = await db
      .select({
        stop_id: kl_transit_stops.stop_id,
        fare_zone: kl_transit_trip_stops.fare_zone,
      })
      .from(kl_transit_trip_stops)
      .innerJoin(
        kl_transit_stops,
        eq(kl_transit_stops.stop_id, kl_transit_trip_stops.stop_id),
      )
      .where(eq(kl_transit_trip_stops.trip_id, tripId))

    return {
      trip_id: trip.trip_id,
      route_id: trip.route_id,
      headsign: trip.headsign,
      direction: trip.direction,
      is_active: trip.is_active,
      full_shape: trip.full_shape,
      stopDetails: stopDetails.map((s) => ({
        stop_id: s.stop_id,
        fare_zone: s.fare_zone,
      })),
      stopPairSegments: [],
    }
  },

  // --------------------------------------------------------
  // 5) Update a trip’s details
  // --------------------------------------------------------
  async updateTrip(
    tripId: number,
    data: {
      headsign?: string
      direction?: number
      isActive?: boolean
      fullShape?: string
    },
  ) {
    // Notice we pass the snake_case columns: is_active, full_shape, etc.
    // But for simplicity, let's just rename in code:
    const dbData: Record<string, unknown> = {}
    if (data.headsign !== undefined) {
      dbData.headsign = data.headsign
    }
    if (data.direction !== undefined) {
      dbData.direction = data.direction
    }
    if (data.isActive !== undefined) {
      dbData.is_active = data.isActive
    }
    if (data.fullShape !== undefined) {
      dbData.full_shape = data.fullShape
    }

    return db
      .update(kl_transit_trips)
      .set(dbData)
      .where(eq(kl_transit_trips.trip_id, tripId))
      .returning()
  },

  // --------------------------------------------------------
  // 6) Update trip stops (replace existing stops)
  // --------------------------------------------------------
  async updateTripStops(
    tripId: number,
    stops: { stopId: number; fareZone: number }[],
  ) {
    // 1) Delete old stops
    await db
      .delete(kl_transit_trip_stops)
      .where(eq(kl_transit_trip_stops.trip_id, tripId))

    // 2) Insert new stops
    return db
      .insert(kl_transit_trip_stops)
      .values(
        stops.map((s) => ({
          trip_id: tripId,
          stop_id: s.stopId,
          fare_zone: s.fareZone,
        })),
      )
      .returning()
  },

  // --------------------------------------------------------
  // 7) Update stop pair segments
  // --------------------------------------------------------
  async updateStopPairSegments(
    segments: {
      fromStopId: number
      toStopId: number
      distance?: number | null
      segmentShape?: string | null
    }[],
  ) {
    // Drizzle's .onConflictDoUpdate works if you're using drizzle-orm/node-postgres driver
    // For vercel-postgres, you may need raw SQL upsert.
    return db
      .insert(kl_transit_stop_pair_segments)
      .values(
        segments.map((seg) => ({
          from_stop_id: seg.fromStopId,
          to_stop_id: seg.toStopId,
          distance: seg.distance ?? null,
          segment_shape: seg.segmentShape ?? null,
        })),
      )
      .onConflictDoUpdate({
        target: [
          kl_transit_stop_pair_segments.from_stop_id,
          kl_transit_stop_pair_segments.to_stop_id,
        ],
        set: {
          distance: sql`EXCLUDED.distance`,
          segment_shape: sql`EXCLUDED.segment_shape`,
        },
      })
      .returning()
  },

  // --------------------------------------------------------
  // 8) Get a single stop
  // --------------------------------------------------------
  async getStop(stopId: number) {
    return db.query.kl_transit_stops.findFirst({
      where: eq(kl_transit_stops.stop_id, stopId),
    })
  },
}
