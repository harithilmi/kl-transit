'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/layout/loading-spinner'
import type { Stop } from '@/types/routes'

const StopEdit = dynamic(
  () => import('@/app/components/map/stop-editor/stop-map-edit'),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
  },
)

interface ClientPageProps {
  stops: Stop[]
}

export default function ClientPage({ stops }: ClientPageProps) {
  return (
    <main className="relative h-[calc(100dvh-65px)] w-full bg-background overflow-hidden">
      <Suspense fallback={<LoadingSpinner />}>
        <StopEdit stops={stops} />
      </Suspense>
    </main>
  )
}
