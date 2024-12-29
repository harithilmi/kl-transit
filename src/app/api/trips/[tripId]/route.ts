import { NextResponse } from 'next/server'
import routes from '@/data/v2/routes.json'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { tripId: string } },
) {
  try {
    const tripId = parseInt(params.tripId)

    // Find the route that contains this trip ID
    const route = routes.find((route) =>
      route.trips.some((trip) => trip.tripId === tripId),
    )

    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Route not found for this trip' },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { success: true, data: route },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    )
  } catch (error) {
    console.error('Trip API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch route details',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
