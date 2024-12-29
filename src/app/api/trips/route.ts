import { NextResponse } from 'next/server'
import { getRouteData } from '@/lib/routes'
import routes from '@/data/v2/routes.json'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('id')

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: 'Trip ID is required' },
        { status: 400 },
      )
    }

    // Find the trip in the static JSON data
    const trip = routes
      .flatMap((route) => route.trips)
      .find((trip) => trip.tripId.toString() === tripId)

    if (!trip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found' },
        { status: 404 },
      )
    }

    // Get the route details
    const routeDetails = await getRouteData(trip.routeId)

    // Combine the data
    const response = {
      [tripId]: {
        ...routeDetails,
        tripDetails: {
          tripId: trip.tripId,
          headsign: trip.headsign,
          direction: trip.direction,
          isActive: trip.isActive,
          fullShape: trip.fullShape,
          stopDetails: trip.stopDetails,
        },
      },
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Trip API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trip details',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// api/trips/route?id=1
