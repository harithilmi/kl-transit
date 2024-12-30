'use client'

import { Badge } from '@/app/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { useMemo } from 'react'
import type { Route, Stop } from '@/types/routes'
import { useTranslations } from 'next-intl'

function useStopDetails(stops: Stop[], stopIds: number[]): (Stop | null)[] {
  return useMemo(
    () =>
      stopIds.map((id) => stops.find((stop) => stop.stop_id === id) ?? null),
    [stops, stopIds],
  )
}

function StopList({ stops }: { stops: (Stop | null)[] }) {
  return (
    <div className="flex flex-col gap-2">
      {stops.map((stop, index) => {
        if (!stop) return null
        return (
          <div
            key={`${stop.stop_id}-${index}`}
            className="flex flex-col gap-1 p-2 hover:bg-accent/50 rounded-lg transition-colors duration-300"
          >
            <div className="flex justify-start">
              {stop.stop_code && (
                <Badge variant="secondary" className="shrink-0">
                  {stop.stop_code}
                </Badge>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate">{stop.stop_name}</span>
              {stop.street_name && (
                <span className="text-muted-foreground truncate">
                  {stop.street_name}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function RouteStopList({
  routeData,
  stops,
}: {
  routeData: Route
  stops: Stop[]
}) {
  const t = useTranslations('RoutesPage')
  const direction0Trip = routeData.trips.find((t) => t.direction === 0)
  const direction1Trip = routeData.trips.find((t) => t.direction === 1)

  const direction0Stops = useStopDetails(
    stops,
    direction0Trip?.stopDetails.map((s) => s.stopId) ?? [],
  )
  const direction1Stops = useStopDetails(
    stops,
    direction1Trip?.stopDetails.map((s) => s.stopId) ?? [],
  )

  if (routeData.trips.length === 1) {
    return (
      <div className="h-full flex">
        <div className="flex w-full flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <StopList
              stops={direction0Trip ? direction0Stops : direction1Stops}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      <div className="flex w-full flex-col overflow-hidden">
        <Tabs defaultValue="direction0" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="w-full">
              {direction0Trip && (
                <TabsTrigger value="direction0" className="flex-1">
                  {t('to')} {direction0Trip.headsign}
                </TabsTrigger>
              )}
              {direction1Trip && (
                <TabsTrigger value="direction1" className="flex-1">
                  {t('to')} {direction1Trip.headsign}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {direction0Trip && (
              <TabsContent value="direction0" className="mt-0 h-full">
                <StopList stops={direction0Stops} />
              </TabsContent>
            )}
            {direction1Trip && (
              <TabsContent value="direction1" className="mt-0 h-full">
                <StopList stops={direction1Stops} />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 3600
