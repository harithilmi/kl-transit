'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Route, Stop } from '@/types/routes'
import { useTripEditor } from '@/components/map/trip-editor/trip-editor-context'
import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/layout/loading-spinner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Dynamically import only the map component
const TripMapEdit = dynamic(
  () =>
    import('@/components/map/trip-editor/trip-map-edit').then((mod) => ({
      default: mod.TripMapEdit,
    })),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
  },
)

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface TripEditorPageProps {
  params: {
    locale: string
    routeId: string
    tripId: string
  }
}

interface UseStopsResult {
  data: Stop[] | null
  isLoading: boolean
  error: Error | null
}

// Mock useStops hook until it's implemented
const useStops = (): UseStopsResult => {
  const [data, setData] = useState<Stop[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchStops = async () => {
      try {
        const response = await fetch('/api/stops')
        if (!response.ok) {
          throw new Error('Failed to fetch stops')
        }
        const { data } = (await response.json()) as ApiResponse<Stop[]>
        setData(data ?? null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    void fetchStops()
  }, [])

  return { data, isLoading, error }
}

export default function TripEditorContent({ params }: TripEditorPageProps) {
  const {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    pendingStopDetails,
    setPendingStopDetails,
    pendingSegments,
    setPendingSegments,
    isSaving,
    setIsSaving,
  } = useTripEditor()
  const {
    data: allStops,
    isLoading: isLoadingStops,
    error: stopsError,
  } = useStops()
  const [routeData, setRouteData] = useState<Route | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(true)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [batchId, setBatchId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch route data
  useEffect(() => {
    if (!params.routeId) {
      setError('Route ID is missing')
      setIsLoadingRoute(false)
      return
    }

    const fetchRoute = async () => {
      try {
        const response = await fetch(`/api/routes/${params.routeId}`)
        const { success, data, error } = (await response.json()) as ApiResponse<
          Route
        >

        if (!success || !data) {
          throw new Error(error ?? 'Failed to fetch route')
        }

        setRouteData(data)
      } catch (error) {
        console.error('Error fetching route:', error)
        setError(
          error instanceof Error ? error.message : 'Failed to fetch route',
        )
      } finally {
        setIsLoadingRoute(false)
      }
    }

    void fetchRoute()
  }, [params.routeId])

  const trip = useMemo(() => {
    if (!routeData) return null
    return routeData.trips.find((t) => t.tripId === Number(params.tripId))
  }, [routeData, params.tripId])

  // Initialize pendingStopDetails with current trip stops when trip changes
  useEffect(() => {
    if (trip?.stopDetails) {
      setPendingStopDetails(trip.stopDetails)
      setPendingSegments(trip.stopPairSegments ?? [])
    }
  }, [
    trip?.stopDetails,
    trip?.stopPairSegments,
    setPendingStopDetails,
    setPendingSegments,
  ])

  const tripStops = useMemo(() => {
    if (!pendingStopDetails || !allStops) {
      return []
    }

    // Map each stop detail to its corresponding stop
    const stops = pendingStopDetails
      .map((detail: { stopId: number; fareZone: number }) => {
        const stop = allStops.find((s) => s.stop_id === detail.stopId)
        if (!stop) return null
        return stop
      })
      .filter((stop: Stop | null): stop is Stop => stop !== null)

    return stops
  }, [pendingStopDetails, allStops])

  const handleSave = async () => {
    if (!trip || !routeData) return

    try {
      setIsSaving(true)

      const response = await fetch(`/api/trips/${params.tripId}/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: Number(params.tripId),
          routeId: routeData.routeId,
          changes: {
            stopDetails: pendingStopDetails,
            stopPairSegments: pendingSegments,
          },
        }),
      })

      const data = (await response.json()) as ApiResponse<{ batchId: number }>

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to save suggestion')
      }

      toast.success('Changes submitted successfully')
      setHasUnsavedChanges(false)
      setBatchId(data.data?.batchId ?? null)
      setShowSuccessDialog(true)
    } catch (error) {
      console.error('Error saving suggestion:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to save suggestion',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false)
    window.location.reload()
  }

  // Update hasUnsavedChanges when changes are detected
  useEffect(() => {
    if (!trip) return

    const currentStops = trip.stopDetails
    const currentSegments = trip.stopPairSegments ?? []

    const hasChanges =
      JSON.stringify(currentStops) !== JSON.stringify(pendingStopDetails) ||
      JSON.stringify(currentSegments) !== JSON.stringify(pendingSegments)

    setHasUnsavedChanges(hasChanges)
  }, [trip, pendingStopDetails, pendingSegments, setHasUnsavedChanges])

  if (isLoadingRoute || isLoadingStops) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-destructive">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    )
  }

  if (!routeData || !trip) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Trip not found</h2>
          <p className="text-muted-foreground">
            The requested trip could not be found.
          </p>
        </Card>
      </div>
    )
  }

  if (stopsError) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-destructive">
            Error Loading Stops
          </h2>
          <p className="text-muted-foreground">{stopsError.message}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Trip</h1>
          <p className="text-muted-foreground">
            {routeData.routeShortName} - {trip.headsign}
          </p>
        </div>

        {hasUnsavedChanges && (
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      <TripMapEdit
        stops={tripStops}
        allStops={allStops ?? []}
        onSegmentsChange={setPendingSegments}
        onStopSequenceChange={setPendingStopDetails}
      />

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Changes Submitted Successfully</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Your changes have been submitted for approval. The changes will
                be reviewed by our team before being published.
              </p>
              {batchId && (
                <p className="text-muted-foreground">
                  Suggestion Batch ID: {batchId}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseSuccessDialog}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
