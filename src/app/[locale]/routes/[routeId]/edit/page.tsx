'use client'

import { Suspense, useEffect, useState, use } from 'react'
import dynamic from 'next/dynamic'
import { fetchRouteData } from '@/lib/routes'
import { notFound } from 'next/navigation'
import type { RouteDetails } from '@/types/routes'
import { useAuth } from '@clerk/nextjs'

const LazyMap = dynamic(() => import('@/app/components/route-edit'), {
  ssr: false,
  loading: () => <p>Loading...</p>,
})

export default function RouteEditPage({
  params,
}: {
  params: Promise<{ routeId: string }>
}) {
  const { routeId } = use(params)
  const [routeData, setRouteData] = useState<RouteDetails | null>(null)

  const { userId, isLoaded } = useAuth()

  useEffect(() => {
    if (isLoaded && !userId) {
      window.location.href = '/sign-in'
      return
    }
    if (userId) {
      fetchRouteData(routeId)
        .then((data) => {
          if (!data) return notFound()
          setRouteData(data)
        })
        .catch((error) => {
          console.error('Error loading route:', error)
        })
    }
  }, [routeId, userId, isLoaded])

  if (!isLoaded || !routeData) return <p>Loading...</p>

  return (
    <main className="relative h-[calc(100dvh-65px)] w-full bg-background overflow-hidden">
      <Suspense fallback={<p>Loading...</p>}>
        <LazyMap
          routeId={routeId}
          services={routeData.services}
          shape={routeData.shape}
        />
      </Suspense>
    </main>
  )
}
