'use client'

import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/layout/loading-spinner'

const TripEditorContent = dynamic(() => import('./client-page'), {
  ssr: false,
  loading: () => <LoadingSpinner />,
})

interface TripEditorWrapperProps {
  routeId: string
  tripId: string
  locale: string
}

export function TripEditorWrapper({
  routeId,
  tripId,
  locale,
}: TripEditorWrapperProps) {
  return <TripEditorContent params={{ routeId, tripId, locale }} />
}
