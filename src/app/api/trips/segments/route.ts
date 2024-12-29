import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  fromStopId: z.number(),
  toStopId: z.number(),
  fromCoords: z.tuple([z.number(), z.number()]),
  toCoords: z.tuple([z.number(), z.number()]),
})

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ORS_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouteService API key not configured' },
        { status: 500 },
      )
    }

    const body = await req.json()
    const validatedData = requestSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validatedData.error.errors,
        },
        { status: 400 },
      )
    }

    const { fromCoords, toCoords, fromStopId, toStopId } = validatedData.data

    // Call OpenRouteService API
    const response = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: ORS_API_KEY,
        },
        body: JSON.stringify({
          coordinates: [fromCoords, toCoords],
          instructions: false,
          geometry_simplify: true,
          continue_straight: true,
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`OpenRouteService API error: ${response.statusText}`)
    }

    const data = await response.json()

    // Extract the geometry and distance from the response
    const geometry = data.routes[0].geometry
    const distance = data.routes[0].summary.distance // in meters

    return NextResponse.json({
      success: true,
      data: {
        fromStopId,
        toStopId,
        distance,
        segmentShape: geometry,
      },
    })
  } catch (error) {
    console.error('Error fetching route shape:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
