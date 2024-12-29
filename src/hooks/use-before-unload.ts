'use client'

import { useEffect } from 'react'

/**
 * Hook to handle the beforeunload event
 * @param handler The handler to call when the beforeunload event is triggered
 */
export function useBeforeUnload(handler: (e: BeforeUnloadEvent) => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [handler])
}
