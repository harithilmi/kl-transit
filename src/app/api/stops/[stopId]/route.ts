import { NextResponse } from 'next/server'
import { getStops } from '@/lib/data/access'

export async function GET(
  request: Request,
  { params }: { params: { stopId: string } },
) {
  try {
    const stops = await getStops()
    const stopId = params.stopId
    const stop = stops.find((s) => s.stop_id === Number(stopId))
    return NextResponse.json(stop)
  } catch (error) {
    console.error('Error fetching stops:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stops' },
      { status: 500 },
    )
  }
}
