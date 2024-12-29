import { NextResponse } from 'next/server'
import { filterServices } from '@/lib/services'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stopId = searchParams.get('stopId')
    const routeNumber = searchParams.get('routeNumber')
    const direction = searchParams.get('direction')

    const services = await filterServices({
      stopId: stopId ? Number(stopId) : undefined,
      routeNumber: routeNumber ?? undefined,
      direction: direction ? (Number(direction) as 1 | 2) : undefined,
    })

    return NextResponse.json(services, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 },
    )
  }
}
