import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { Route } from '@/types/routes'
import routes from '@/data/v2/routes.json'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const routeIds = searchParams.get('id')?.split(',') ?? []
  const searchQuery = searchParams.get('q')?.toLowerCase()

  // If neither search query nor route IDs are provided
  if (!searchQuery && routeIds.length === 0) {
    return NextResponse.json(
      { error: 'Query or Route ID is required' },
      { status: 400 },
    )
  }

  try {
    // Handle search query
    if (searchQuery) {
      const searchResults = (routes as Route[])
        .filter(
          (route) =>
            route.routeShortName.toLowerCase().includes(searchQuery) ||
            route.routeLongName.toLowerCase().includes(searchQuery),
        )
        .map((route) => ({
          id: route.routeId,
          route_number: route.routeShortName,
          route_name: route.routeLongName,
        }))
        .slice(0, 10) // Limit results to 10 items

      return NextResponse.json(searchResults, {
        headers: {
          'Cache-Control':
            'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      })
    }

    // Handle route ID lookup
    const routeData = routeIds.reduce((acc, routeId) => {
      const route = routes.find((r) => r.routeId === parseInt(routeId))
      if (route) {
        acc[routeId] = route
      }
      return acc
    }, {} as Record<string, Route>)

    // If no routes were found
    if (Object.keys(routeData).length === 0) {
      return NextResponse.json({ error: 'No routes found' }, { status: 404 })
    }

    return NextResponse.json(routeData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
