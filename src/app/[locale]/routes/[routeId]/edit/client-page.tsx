'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import type { RouteDetails } from '@/types/routes'

const RouteEdit = dynamic(() => import('@/app/components/route-edit-map'), {
  ssr: false,
  loading: () => <LoadingSpinner />,
})

export default function ClientPage({
  routeData,
  routeId,
}: {
  routeData: RouteDetails
  routeId: string
}) {
  return (
    <main className="relative h-[calc(100dvh-65px)] w-full bg-background overflow-hidden">
      <Suspense fallback={<LoadingSpinner />}>
        <RouteEdit
          routeId={routeId}
          services={routeData.services}
          shape={routeData.shape}
        />
      </Suspense>
    </main>
  )
}
