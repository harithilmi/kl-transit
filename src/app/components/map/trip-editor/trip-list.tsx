'use client'

import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Link } from '@/i8n/routing'
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import type { Trip } from '@/types/routes'
import { useTranslations } from 'next-intl'

interface TripListProps {
  routeId: number
  trips: Trip[]
  onDeleteTrip: (tripId: number) => void
}

export function TripList({ routeId, trips, onDeleteTrip }: TripListProps) {
  const t = useTranslations()

  return (
    <div className="rounded-lg border h-full">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="font-semibold">{t('RouteEdit.trips.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('RouteEdit.trips.count', { count: trips.length })}
          </p>
        </div>
        <Button asChild>
          <Link href={`/routes/${routeId}/edit/trips/new`}>
            <PlusIcon className="w-4 h-4 mr-2" />
            {t('RouteEdit.trips.add')}
          </Link>
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="p-4 space-y-2">
          {trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <p>{t('RouteEdit.trips.empty')}</p>
              <p className="text-sm">{t('RouteEdit.trips.emptyDescription')}</p>
            </div>
          ) : (
            trips.map((trip) => (
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
                        count: trip.stopDetails.length,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/routes/${routeId}/edit/trips/${trip.tripId}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteTrip(trip.tripId)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
