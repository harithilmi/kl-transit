'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from '@/types/routes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface TripBreadcrumbProps {
  tripId: string
  showSeparator?: boolean
}

interface ApiResponse {
  success: boolean
  data?: Route
  error?: string
}

export function TripBreadcrumb({
  tripId,
  showSeparator = true,
}: TripBreadcrumbProps) {
  const [routeData, setRouteData] = useState<Route | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const t = useTranslations()

  useEffect(() => {
    async function fetchRoute() {
      try {
        const response = await fetch(`/api/trips/${tripId}`)
        if (!response.ok) return

        const { success, data } = (await response.json()) as ApiResponse
        if (success && data) {
          setRouteData(data)
        }
      } catch (error) {
        console.error('Error fetching route:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchRoute()
  }, [tripId])

  if (isLoading || !routeData) {
    return (
      <div className="text-sm text-muted-foreground">{t('nav.loading')}...</div>
    )
  }

  const currentTrip = routeData.trips.find(
    (trip) => trip.tripId === parseInt(tripId),
  )

  if (!currentTrip) return null

  return (
    <>
      {showSeparator && (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-1 px-2 font-normal"
          >
            <span className="text-muted-foreground mr-1">
              {currentTrip.direction === 0 ? '→' : '←'}
            </span>
            {currentTrip.headsign}
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {routeData.trips.map((trip) => (
            <DropdownMenuItem
              key={trip.tripId}
              onClick={() =>
                router.push(
                  `/routes/${routeData.routeId}/edit/trips/${trip.tripId}`,
                )
              }
              className="flex items-center gap-2"
            >
              <span className="text-muted-foreground">
                {trip.direction === 0 ? '→' : '←'}
              </span>
              <span>{trip.headsign}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
