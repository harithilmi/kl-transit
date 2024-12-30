'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { MapPin, Route, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import type { Route as RouteType } from '@/types/routes'

interface EditorSidebarProps {
  className?: string
  routeId: string
  tripId: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface LastEditedInfo {
  routeId: string
  tripId: string
}

export function EditorSidebar({
  className,
  routeId,
  tripId,
}: EditorSidebarProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const [routeData, setRouteData] = useState<RouteType | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isStopEditor = pathname.includes('/stops/edit')
  const isTripEditor = pathname.includes('/trips')
  const isRouteEditor = pathname.endsWith(`/routes/${routeId}/edit`)
  const locale = pathname.split('/')[1]

  // Store current route and trip when in route or trip editor
  useEffect(() => {
    if ((isRouteEditor || isTripEditor) && routeId) {
      const lastEditedInfo: LastEditedInfo = {
        routeId,
        tripId: tripId || '',
      }
      localStorage.setItem('lastEditedInfo', JSON.stringify(lastEditedInfo))
    }
  }, [isRouteEditor, isTripEditor, routeId, tripId])

  // Fetch route data when routeId changes
  useEffect(() => {
    if (!routeId) return

    const fetchRoute = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/routes/${routeId}`)
        const { success, data, error } = (await response.json()) as ApiResponse<
          RouteType
        >

        if (!success || !data) {
          throw new Error(error ?? 'Failed to fetch route')
        }

        setRouteData(data)
      } catch (error) {
        console.error('Error fetching route:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchRoute()
  }, [routeId])

  const handleRouteEditorClick = () => {
    // If we have current route ID, use it
    if (routeId) {
      router.push(`/${locale}/routes/${routeId}/edit`)
      return
    }

    // Otherwise, try to get the last edited route
    const lastEditedInfoStr = localStorage.getItem('lastEditedInfo')
    if (lastEditedInfoStr) {
      try {
        const lastEditedInfo = JSON.parse(lastEditedInfoStr) as LastEditedInfo
        if (lastEditedInfo.routeId) {
          router.push(`/${locale}/routes/${lastEditedInfo.routeId}/edit`)
          return
        }
      } catch (error) {
        console.error('Error parsing last edited info:', error)
      }
    }

    // If no route info available
    toast.error('Please select a route first')
  }

  const handleTripEditorClick = () => {
    // First try current route ID
    let currentRouteId = routeId
    let currentTripId = tripId

    // If we don't have a current route ID, try to get from localStorage
    if (!currentRouteId) {
      const lastEditedInfoStr = localStorage.getItem('lastEditedInfo')
      if (lastEditedInfoStr) {
        try {
          const lastEditedInfo = JSON.parse(lastEditedInfoStr) as LastEditedInfo
          currentRouteId = lastEditedInfo.routeId
          currentTripId = lastEditedInfo.tripId
        } catch (error) {
          console.error('Error parsing last edited info:', error)
        }
      }
    }

    if (!currentRouteId) {
      toast.error('Please select a route first')
      return
    }

    // If we have a valid trip ID, use it
    if (currentTripId) {
      router.push(
        `/${locale}/routes/${currentRouteId}/edit/trips/${currentTripId}`,
      )
      return
    }

    // Otherwise, fetch route data and use first trip
    if (!routeData) {
      toast.error('Loading route data...')
      return
    }

    const firstTrip = routeData.trips[0]
    if (firstTrip) {
      router.push(
        `/${locale}/routes/${currentRouteId}/edit/trips/${firstTrip.tripId}`,
      )
      return
    }

    // If no trips, suggest adding one
    toast.error(
      'No trips found for this route. Add a trip in the route editor.',
    )
  }

  return (
    <div
      className={cn(
        'flex h-full w-[60px] flex-col items-center gap-4 border-r bg-background p-2',
        className,
      )}
    >
      <Button
        variant={isRouteEditor ? 'default' : 'ghost'}
        size="icon"
        className="h-10 w-10"
        onClick={handleRouteEditorClick}
        title={t('nav.routeEditor')}
      >
        <Settings className="h-5 w-5" />
      </Button>
      <Separator className="w-8" />
      <Button
        variant={isTripEditor ? 'default' : 'ghost'}
        size="icon"
        className="h-10 w-10"
        onClick={handleTripEditorClick}
        title={t('nav.tripEditor')}
      >
        <Route className="h-5 w-5" />
      </Button>
      <Separator className="w-8" />
      <Button
        variant={isStopEditor ? 'default' : 'ghost'}
        size="icon"
        className="h-10 w-10"
        onClick={() => router.push(`/${locale}/stops/edit`)}
        title={t('nav.stopEditor')}
      >
        <MapPin className="h-5 w-5" />
      </Button>
    </div>
  )
}
