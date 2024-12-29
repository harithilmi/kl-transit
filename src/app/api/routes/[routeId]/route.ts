import { NextResponse } from 'next/server'
import routes from '@/data/v2/routes.json'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { routeId: string } },
) {
  try {
    const routeId = parseInt(params.routeId)

    // Find the specific route by routeId
    const route = routes.find((route) => route.routeId === routeId)

    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Route not found' },
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
    console.error('Route API Error:', error)
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
