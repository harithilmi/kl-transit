import { Suspense } from 'react'
import LoadingSpinner from '@/components/layout/loading-spinner'
import { EditorSidebar } from '@/components/layout/editor-sidebar'
import { TripEditorProvider } from '@/components/map/trip-editor/trip-editor-context'
import { TripNavigationGuard } from '@/components/map/trip-editor/trip-navigation-guard'
import { TripEditorWrapper } from './trip-editor-wrapper'

interface PageProps {
  params: {
    locale: string
    routeId: string
    tripId: string
  }
}

export default function Page({ params }: PageProps) {
  return (
    <main className="relative h-[calc(100dvh-65px)] w-full bg-background overflow-hidden">
      <div className="flex h-full">
        <EditorSidebar routeId={params.routeId} tripId={params.tripId} />
        <div className="flex-1">
          <TripEditorProvider>
            <TripNavigationGuard />
            <Suspense fallback={<LoadingSpinner />}>
              <TripEditorWrapper
                routeId={params.routeId}
                tripId={params.tripId}
                locale={params.locale}
              />
            </Suspense>
          </TripEditorProvider>
        </div>
      </div>
    </main>
  )
}
