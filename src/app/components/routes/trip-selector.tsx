'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Link } from '@/i8n/routing'
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import type { Route, Trip } from '@/types/routes'
import { toast } from 'sonner'

interface TripSelectorProps {
  routeId: string
}

interface RouteResponse {
  success: boolean
  data?: Route
  error?: string
}

export function TripSelector({ routeId }: TripSelectorProps) {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [routeData, setRouteData] = useState<Route | null>(null)

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await fetch(`/api/routes/${routeId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch route')
        }

        const responseData = (await response.json()) as RouteResponse

        if (!responseData.success || !responseData.data) {
          throw new Error(responseData.error ?? 'Failed to fetch route')
        }

        const data = responseData.data

        // Ensure trips array exists and is initialized
        if (!Array.isArray(data.trips)) {
          data.trips = []
        }

        // Ensure each trip has a stopDetails array
        data.trips = data.trips.map((trip) => ({
          ...trip,
          stopDetails: Array.isArray(trip.stopDetails) ? trip.stopDetails : [],
        }))

        setRouteData(data)
      } catch (error) {
        console.error('Error fetching route:', error)
        toast.error(t('RouteEdit.errors.fetchFailed'))
      } finally {
        setIsLoading(false)
      }
    }

    void fetchRoute()
  }, [routeId, t])

  const handleDeleteTrip = async (tripId: number) => {
    if (!confirm(t('RouteEdit.trips.deleteConfirm'))) return

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete trip')

      // Refresh the route data
      const routeResponse = await fetch(`/api/routes/${routeId}`)
      if (!routeResponse.ok) {
        throw new Error('Failed to refresh route data')
      }

      const responseData = (await routeResponse.json()) as RouteResponse

      if (!responseData.success || !responseData.data) {
        throw new Error(responseData.error ?? 'Failed to fetch route')
      }

      const data = responseData.data

      // Ensure trips array exists and is initialized
      if (!Array.isArray(data.trips)) {
        data.trips = []
      }

      // Ensure each trip has a stopDetails array
      data.trips = data.trips.map((trip) => ({
        ...trip,
        stopDetails: Array.isArray(trip.stopDetails) ? trip.stopDetails : [],
      }))

      setRouteData(data)
      toast.success(t('RouteEdit.trips.deleteSuccess'))
    } catch (error) {
      console.error('Error deleting trip:', error)
      toast.error(t('RouteEdit.trips.deleteFailed'))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <p className="text-muted-foreground">{t('Common.loading')}</p>
      </div>
    )
  }

  if (!routeData) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <p className="text-muted-foreground">
          {t('RouteEdit.errors.notFound')}
        </p>
      </div>
    )
  }

  // Ensure trips is always an array
  const trips = Array.isArray(routeData.trips) ? routeData.trips : []

  const renderTripCard = (trip: Trip) => {
    if (!trip) {
      console.warn('Received undefined trip')
      return null
    }

    // Ensure stopDetails is always an array
    const stopDetails = Array.isArray(trip.stopDetails) ? trip.stopDetails : []
    const stopCount = stopDetails.length

    return (
      <Card key={trip.tripId} className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            {trip.direction === 0 ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{trip.headsign}</h3>
            <p className="text-sm text-muted-foreground">
              {t('RouteEdit.trips.stopCount', {
                count: stopCount,
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/routes/${routeId}/edit/trips/${trip.tripId}`}>
                <PencilIcon className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteTrip(trip.tripId)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">{t('TripSelector.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('TripSelector.description')}
            </p>
          </div>
          <Button asChild>
            <Link href={`/routes/${routeId}/edit/trips/new`}>
              <PlusIcon className="w-4 h-4 mr-2" />
              {t('RouteEdit.trips.add')}
            </Link>
          </Button>
        </div>

        <div className="grid gap-4">
          {trips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {t('RouteEdit.trips.empty')}
              </p>
            </div>
          ) : (
            trips.map(renderTripCard)
          )}
        </div>
      </Card>
    </div>
  )
}
