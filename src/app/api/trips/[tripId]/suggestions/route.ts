import { db } from '@/server/db'
import { tripSuggestions, tripSuggestionBatches } from '@/server/db/schema'
import type { TripChanges } from '@/server/db/schema'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const stopDetailSchema = z.object({
  stopId: z.number(),
  fareZone: z.number(),
})

const stopPairSegmentSchema = z.object({
  fromStopId: z.number(),
  toStopId: z.number(),
  distance: z.number().nullable(),
  segmentShape: z.string().nullable(),
})

const requestSchema = z.object({
  tripId: z.number(),
  routeId: z.number(),
  changes: z.object({
    stopDetails: z.array(stopDetailSchema),
    stopPairSegments: z.array(stopPairSegmentSchema).optional(),
  }),
})

type RequestBody = z.infer<typeof requestSchema>

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as RequestBody
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

    const { tripId, routeId, changes } = validatedData.data

    // Create a new batch
    const [batch] = await db
      .insert(tripSuggestionBatches)
      .values({
        userId,
        status: 'pending',
      })
      .returning()

    if (!batch) {
      throw new Error('Failed to create suggestion batch')
    }

    // Insert the suggestion
    await db.insert(tripSuggestions).values({
      userId,
      status: 'pending',
      tripId: tripId.toString(),
      routeId: routeId.toString(),
      changes: changes as TripChanges,
      type: 'edit',
      batchId: batch.id,
    })

    return NextResponse.json({
      success: true,
      batchId: batch.id,
    })
  } catch (error) {
    console.error('Error creating trip suggestion:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
