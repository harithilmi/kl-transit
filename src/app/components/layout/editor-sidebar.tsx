'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { MapPin, Route, Settings } from 'lucide-react'

interface EditorSidebarProps {
  className?: string
  routeId: string
}

export function EditorSidebar({ className, routeId }: EditorSidebarProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split('/')[1]

  // Simplified path checks
  const isStopEditor = pathname.includes('/stops/edit')
  const isTripEditor =
    pathname.includes('/routes/') && pathname.includes('/trips/')
  const isRouteEditor = pathname.endsWith(`/routes/${routeId}/edit`)

  return (
    <div
      className={cn(
        'flex h-full w-[60px] flex-col items-center gap-4 border-r bg-background p-2',
        className,
      )}
    >
      {/* Route Editor */}
      <Button
        variant={isRouteEditor ? 'default' : 'ghost'}
        size="icon"
        className="h-10 w-10"
        onClick={() => router.push(`/${locale}/routes/${routeId}/edit`)}
        title={t('nav.routeEditor')}
      >
        <Settings className="h-5 w-5" />
      </Button>

      <Separator className="w-8" />

      {/* Trip Editor */}
      <Button
        variant={isTripEditor ? 'default' : 'ghost'}
        size="icon"
        className="h-10 w-10"
        onClick={() => router.push(`/${locale}/routes/${routeId}/edit/trips`)}
        title={t('nav.tripEditor')}
      >
        <Route className="h-5 w-5" />
      </Button>

      <Separator className="w-8" />

      {/* Stop Editor */}
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
