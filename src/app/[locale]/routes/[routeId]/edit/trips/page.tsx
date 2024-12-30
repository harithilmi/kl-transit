import { EditorSidebar } from '@/app/components/layout/editor-sidebar'
import { TripSelector } from '@/app/components/routes/trip-selector'

interface Props {
  params: {
    routeId: string
    locale: string
  }
}

export default function TripsPage({ params: { routeId } }: Props) {
  return (
    <div className="flex h-screen">
      <EditorSidebar routeId={routeId} />
      <main className="flex-1 overflow-y-auto">
        <div className="container py-6">
          <TripSelector routeId={routeId} />
        </div>
      </main>
    </div>
  )
}
