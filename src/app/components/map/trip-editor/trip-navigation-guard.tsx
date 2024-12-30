'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTripEditor } from './trip-editor-context'

export function TripNavigationGuard() {
  const { hasUnsavedChanges } = useTripEditor()
  const router = useRouter()

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  return null
}
