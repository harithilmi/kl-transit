import { getTranslations } from 'next-intl/server'
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

interface TripSelectorProps {
  routeData: Route
}


export async function TripSelector({ routeData }: TripSelectorProps) {
  const t = await getTranslations()

  const { routeId } = routeData

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

  console.log(trips)
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
              // TODO: Add delete trip
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
