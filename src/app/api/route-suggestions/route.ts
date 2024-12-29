import { auth } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { routeSuggestions } from '@/server/db/schema'
import { eq, and } from 'drizzle-orm'

// Define the expected request body type
interface RouteSuggestionRequest {
  routeNumber: string
  direction: 1 | 2
  stops: Array<{
    id: number
    stopId: string
    sequence: number
    direction: 1 | 2
    zone: number
  }>
}

export async function POST(request: NextRequest) {
  try {
    console.log('Server: Received request')

    // Get auth details
    const { userId } = await auth()

    console.log('Server: Auth details:', { userId })

    // Check authentication
    if (!userId) {
      console.log('Server: Unauthorized - No userId found')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    // Parse request body with type safety
    const body = (await request.json()) as RouteSuggestionRequest
    console.log('Server: Request body:', body)

    const { routeNumber, direction, stops } = body

    // Validate required fields
    if (!routeNumber || !direction || !stops || !Array.isArray(stops)) {
      console.log('Server: Invalid request data:', {
        routeNumber,
        direction,
        stops,
      })
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 },
      )
    }

    try {
      // Insert into database using Drizzle
      const [newSuggestion] = await db
        .insert(routeSuggestions)
        .values({
          routeNumber,
          direction,
          userId,
          stops: stops,
          status: 'pending',
        })
        .returning()

      console.log('Server: Suggestion saved to database:', newSuggestion)

      return NextResponse.json({
        success: true,
        data: newSuggestion,
        message: 'Route suggestion submitted successfully',
      })
    } catch (dbError) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : 'Unknown database error'
      console.error('Database Error:', errorMessage)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save suggestion',
          details: errorMessage,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    const errorDetails = {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
    console.error('Server Error:', errorDetails)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: errorDetails.message,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get('routeId')
    const status = searchParams.get('status')

    // Start with a base query
    const baseQuery = db.select().from(routeSuggestions)

    // Build conditions array
    const conditions = []

    if (routeId) {
      conditions.push(eq(routeSuggestions.routeNumber, routeId))
    }

    if (status) {
      conditions.push(eq(routeSuggestions.status, status))
    }

    // Apply all conditions at once
    const suggestions = await (conditions.length > 0
      ? baseQuery.where(and(...conditions))
      : baseQuery)

    return NextResponse.json({
      success: true,
      data: suggestions,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('API Error:', errorMessage)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch suggestions',
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
