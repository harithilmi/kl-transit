'use client'

import { Badge } from '@/app/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { useMemo, useRef, useEffect, useState } from 'react'
import type { Route, Stop } from '@/types/routes'
import { useTranslations } from 'next-intl'
import { useSelectedStop } from '@/app/components/map/route-viewer/selected-stop-context'
import { useMapContext } from '@/app/components/map/route-viewer/map-context'
import { cn } from '@/lib/utils'

function useStopDetails(stops: Stop[], stopIds: number[]): (Stop | null)[] {
  return useMemo(
    () =>
      stopIds.map((id) => stops.find((stop) => stop.stop_id === id) ?? null),
    [stops, stopIds],
  )
}

function StopList({ stops }: { stops: (Stop | null)[] }) {
  const { selectedStop, setSelectedStop } = useSelectedStop()
  const { map } = useMapContext()
  const selectedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedStop && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [selectedStop])

  const handleStopClick = (stop: Stop) => {
    const isSelected = selectedStop?.stop_id === stop.stop_id
    if (!isSelected && map) {
      map.setView([stop.latitude, stop.longitude], 16, {
        animate: true,
        duration: 1,
      })
    }
    setSelectedStop(isSelected ? null : stop)
  }

  return (
    <div className="flex flex-col gap-2">
      {stops.map((stop, index) => {
        if (!stop) return null
        const isSelected = selectedStop?.stop_id === stop.stop_id

        return (
          <div
            key={`${stop.stop_id}-${index}`}
            ref={isSelected ? selectedRef : null}
            className={cn(
              'flex flex-col gap-1 p-2 rounded-lg transition-colors duration-300 cursor-pointer',
              isSelected
                ? 'bg-primary/10 hover:bg-primary/20'
                : 'hover:bg-accent/50',
            )}
            onClick={() => handleStopClick(stop)}
          >
            <div className="flex justify-start">
              {stop.stop_code && (
                <Badge
                  variant={isSelected ? 'default' : 'secondary'}
                  className="shrink-0"
                >
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
  const { selectedStop } = useSelectedStop()
  const [activeTab, setActiveTab] = useState('direction0')
  const lastUserSelectedTabRef = useRef(activeTab)

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

  // Handle manual tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    lastUserSelectedTabRef.current = value
  }

  // Switch to the correct tab only when a stop is selected from the map
  useEffect(() => {
    if (!selectedStop) {
      // When deselecting, go back to the last user-selected tab
      setActiveTab(lastUserSelectedTabRef.current)
      return
    }

    const currentTabStops =
      activeTab === 'direction0' ? direction0Stops : direction1Stops
    const isStopInCurrentTab = currentTabStops.some(
      (stop) => stop?.stop_id === selectedStop.stop_id,
    )

    // Only switch tabs if the selected stop is not in the current tab
    if (!isStopInCurrentTab) {
      const direction0HasStop = direction0Stops.some(
        (stop) => stop?.stop_id === selectedStop.stop_id,
      )
      if (direction0HasStop) {
        setActiveTab('direction0')
      } else {
        setActiveTab('direction1')
      }
    }
  }, [selectedStop, direction0Stops, direction1Stops, activeTab])

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
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="h-full flex flex-col"
        >
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
