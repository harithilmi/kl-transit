'use client'

import type { Route } from '@/types/routes'
import { useEffect } from 'react'

interface RecentRoutes {
  routeId: number
  routeShortName: string
  routeLongName: string
  timestamp: number
}

export function SaveRecentRoutes({ routeData }: { routeData: Route }) {
  useEffect(() => {
    const recentRoute: RecentRoutes = {
      routeId: routeData.routeId,
      routeShortName: routeData.routeShortName,
      routeLongName: routeData.routeLongName,
      timestamp: Date.now(),
    }

    const stored = localStorage.getItem('recentRoutes')
    let recentRoutes: RecentRoutes[] = []

    if (stored) {
      recentRoutes = JSON.parse(stored) as RecentRoutes[]
      recentRoutes = recentRoutes.filter((r) => r.routeId !== routeData.routeId)
    }

    recentRoutes.unshift(recentRoute)
    recentRoutes = recentRoutes.slice(0, 10)

    localStorage.setItem('recentRoutes', JSON.stringify(recentRoutes))
  }, [routeData])

  return null
}
