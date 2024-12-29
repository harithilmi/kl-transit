import { NextResponse } from 'next/server'
import { getStops } from '@/lib/data/access'

export async function GET() {
  try {
    const stopsData = await getStops()
    return NextResponse.json({
      success: true,
      data: stopsData,
    })
  } catch (error) {
    console.error('Error fetching stops:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stops',
      },
      { status: 500 },
    )
  }
}
