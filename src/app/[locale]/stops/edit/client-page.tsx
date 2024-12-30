'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/layout/loading-spinner'
import type { Stop } from '@/types/routes'
import { EditorSidebar } from '@/components/layout/editor-sidebar'

const StopMapEdit = dynamic(
  () => import('@/components/map/stop-editor/stop-map-edit'),
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
      <div className="flex h-full">
        <EditorSidebar routeId="" tripId="" />
        <div className="flex-1">
          <Suspense fallback={<LoadingSpinner />}>
            <StopMapEdit stops={stops} />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
