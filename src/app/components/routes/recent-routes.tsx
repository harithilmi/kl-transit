'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Link } from '@/i8n/routing'
import { useTranslations } from 'next-intl'

interface RecentRoute {
  routeId: number
  routeShortName: string
  routeLongName: string
  timestamp: number
}

export function RecentRoutes() {
  const t = useTranslations()
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('recentRoutes')
    if (stored) {
      const parsed = JSON.parse(stored) as RecentRoute[]
      // Sort by most recent first and limit to 3
      setRecentRoutes(
        parsed.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3),
      )
    }
  }, [])

  if (recentRoutes.length === 0) return null

  return (
    <Card className="w-full max-w-xl p-4">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">
          {t('HomePage.recentRoutes.title')}
        </h2>
        <div className="flex flex-col gap-2">
          {recentRoutes.map((route) => (
            <Link
              key={route.routeId}
              href={`/routes/${route.routeId}`}
              className="flex items-center justify-between rounded-lg p-2 hover:bg-secondary/50"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {t('RoutesPage.routes')} {route.routeShortName}
                </span>
                <span className="text-sm text-muted-foreground">
                  {route.routeLongName}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  )
}
