import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { routeSuggestions } from '@/server/db/schema'

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

    // Parse request body
    const body = await request.json()
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
      console.error('Database Error:', dbError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save suggestion',
          details:
            dbError instanceof Error
              ? dbError.message
              : 'Unknown database error',
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('Server Error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
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

    // Query database using Drizzle
    const suggestions = await db
      .select()
      .from(routeSuggestions)
      .where(routeId ? { routeNumber: routeId } : {})
      .where(status ? { status: status } : {})

    return NextResponse.json({
      success: true,
      data: suggestions,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
