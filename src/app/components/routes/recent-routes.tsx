'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Link } from '@/i8n/routing'
import { useTranslations } from 'next-intl'
import { Trash2Icon } from 'lucide-react'
import { Button } from '../ui/button'

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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {t('HomePage.recentRoutes.title')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              localStorage.removeItem('recentRoutes')
              setRecentRoutes([])
            }}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          {recentRoutes.map((route) => (
            <Link
              key={route.routeId}
              href={`/routes/${route.routeId}`}
              className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2 hover:bg-secondary/70 transition-colors duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="font-medium">{route.routeShortName}</span>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  )
}
