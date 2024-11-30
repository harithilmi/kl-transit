import { NextResponse } from 'next/server'
import type { Route } from '@/types/routes'
import routes from '@/data/from_db/kl-transit_route.json'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() ?? ''

    const formattedRoutes: Route[] = routes.map((route) => ({
      route_id: route.id,
      route_number: route.route_number,
      route_name: route.route_name,
      route_type: route.route_type,
    }))

    const filteredRoutes = formattedRoutes.filter(
      (route) =>
        route.route_number.toLowerCase().includes(query) ||
        route.route_name.toLowerCase().includes(query),
    )

    return new NextResponse(JSON.stringify(filteredRoutes), {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error in routes API:', error)
    return NextResponse.json(
      { error: 'Failed to load routes' },
      { status: 500 },
    )
  }
}
