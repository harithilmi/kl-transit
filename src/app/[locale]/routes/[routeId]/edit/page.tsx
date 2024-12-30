import { notFound } from 'next/navigation'
import routes from '@/data/v2/routes.json'
import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/layout/loading-spinner'
import { EditorSidebar } from '@/components/layout/editor-sidebar'
import { Suspense } from 'react'

const RouteEditClient = dynamic(() => import('./client-page'), {
  loading: () => <LoadingSpinner />,
})

interface Props {
  params: {
    locale: string
    routeId: string
  }
}

export default function RouteEditPage({ params }: Props) {
  const routeId = parseInt(params.routeId)
  const routeData = routes.find((r) => r.routeId === routeId)

  if (!routeData) {
    notFound()
  }

  return (
    <main className="relative h-[calc(100dvh-65px)] w-full bg-background overflow-hidden">
      <div className="flex h-full">
        <EditorSidebar routeId={params.routeId} tripId="" />
        <div className="flex-1">
          <Suspense fallback={<LoadingSpinner />}>
            <RouteEditClient routeData={routeData} />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
