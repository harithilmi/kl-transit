import { EditorSidebar } from '@/app/components/layout/editor-sidebar'
import { TripSelector } from '@/app/components/routes/trip-selector'
import { getRoutes } from '@/lib/data/access'
import type { Route } from '@/types/routes'
import { notFound } from 'next/navigation'

interface Props {
  params: {
    routeId: string
    locale: string
  }
}

export default async function TripsPage({ params: { routeId } }: Props) {
  const routeData = (await getRoutes(routeId)) as Route
  if (!routeData) {
    notFound()
  }

  return (
    <div className="flex h-screen">
      <EditorSidebar routeId={routeId} />
      <main className="flex-1 overflow-y-auto">
        <div className="container py-6">
          <TripSelector routeData={routeData} />
        </div>
      </main>
    </div>
  )
}
