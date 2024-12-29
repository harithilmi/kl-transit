import { db } from '@/server/db'
import { stopSuggestions, stopSuggestionBatches } from '@/server/db/schema'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Define the suggestion types
const suggestionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('new'),
    temporaryId: z.string(),
    stopCode: z.string().optional(),
    stopName: z.string().optional(),
    streetName: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    rapidStopId: z.number().nullable().optional(),
    mrtStopId: z.number().nullable().optional(),
  }),
  z.object({
    type: z.literal('edit'),
    stopId: z.string(),
    changes: z.object({
      stop_code: z.string().optional(),
      stop_name: z.string().optional(),
      street_name: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      rapid_stop_id: z.number().nullable().optional(),
      mrt_stop_id: z.number().nullable().optional(),
    }),
  }),
  z.object({
    type: z.literal('delete'),
    stopId: z.string(),
  }),
])

const requestSchema = z.object({
  suggestions: z.array(suggestionSchema),
})

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as z.infer<typeof requestSchema>
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

    const { suggestions } = validatedData.data

    // Create a new batch
    const [batch] = await db
      .insert(stopSuggestionBatches)
      .values({
        userId,
        status: 'pending',
      })
      .returning()

    if (!batch) {
      throw new Error('Failed to create suggestion batch')
    }

    // Insert all suggestions
    const suggestionValues = suggestions.map((suggestion) => {
      const baseValues = {
        batchId: batch.id,
        userId,
        status: 'pending' as const,
        type: suggestion.type,
      }

      switch (suggestion.type) {
        case 'new':
          return {
            ...baseValues,
            temporaryId: suggestion.temporaryId,
            stopCode: suggestion.stopCode ?? null,
            stopName: suggestion.stopName ?? null,
            streetName: suggestion.streetName ?? null,
            latitude: suggestion.latitude.toString(),
            longitude: suggestion.longitude.toString(),
            rapidStopId: suggestion.rapidStopId?.toString() ?? null,
            mrtStopId: suggestion.mrtStopId?.toString() ?? null,
            changes: {
              stop_code: suggestion.stopCode,
              stop_name: suggestion.stopName,
              street_name: suggestion.streetName,
              latitude: suggestion.latitude,
              longitude: suggestion.longitude,
              rapid_stop_id: suggestion.rapidStopId,
              mrt_stop_id: suggestion.mrtStopId,
            },
          }
        case 'edit':
          return {
            ...baseValues,
            stopId: suggestion.stopId,
            changes: suggestion.changes,
            latitude: suggestion.changes.latitude?.toString() ?? null,
            longitude: suggestion.changes.longitude?.toString() ?? null,
            stopCode: suggestion.changes.stop_code ?? null,
            stopName: suggestion.changes.stop_name ?? null,
            streetName: suggestion.changes.street_name ?? null,
            rapidStopId: suggestion.changes.rapid_stop_id?.toString() ?? null,
            mrtStopId: suggestion.changes.mrt_stop_id?.toString() ?? null,
          }
        case 'delete':
          return {
            ...baseValues,
            stopId: suggestion.stopId,
            changes: {},
          }
      }
    })

    await db.insert(stopSuggestions).values(suggestionValues)

    return NextResponse.json({
      success: true,
      batchId: batch.id,
    })
  } catch (error) {
    console.error('Error creating stop suggestions:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
