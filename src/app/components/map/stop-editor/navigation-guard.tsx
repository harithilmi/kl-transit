'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useStopEditor } from './stop-editor-context'

export function NavigationGuard() {
  const { hasUnsavedChanges } = useStopEditor()
  const router = useRouter()
  const pathname = usePathname()
  const [showDialog, setShowDialog] = useState(false)
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)
  const isNavigating = useRef(false)

  // Handle browser back/forward/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Handle browser back button
  useEffect(() => {
    let blockPopState = false

    const handlePopState = (e: PopStateEvent) => {
      if (!hasUnsavedChanges || isNavigating.current) return

      // Prevent the navigation
      if (!blockPopState) {
        blockPopState = true
        e.preventDefault()

        // Push the current state back to prevent navigation
        window.history.pushState(null, '', pathname)

        // Show confirmation dialog
        setShowDialog(true)
        setPendingUrl(window.location.pathname)

        // Reset block after a short delay
        setTimeout(() => {
          blockPopState = false
        }, 100)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [hasUnsavedChanges, pathname])

  // Handle link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('//')) return
      if (href === pathname) return

      if (hasUnsavedChanges && !isNavigating.current) {
        e.preventDefault()
        e.stopPropagation()
        setShowDialog(true)
        setPendingUrl(href)
      }
    }

    // Capture phase to intercept before Next.js
    document.addEventListener('click', handleClick, { capture: true })
    return () =>
      document.removeEventListener('click', handleClick, { capture: true })
  }, [hasUnsavedChanges, pathname])

  const handleConfirm = useCallback(() => {
    if (pendingUrl) {
      isNavigating.current = true
      setShowDialog(false)
      router.push(pendingUrl)
    }
  }, [pendingUrl, router])

  const handleCancel = useCallback(() => {
    setShowDialog(false)
    setPendingUrl(null)
    // Push current path again to ensure we stay here
    window.history.pushState(null, '', pathname)
  }, [pathname])

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Are you sure you want to leave? Your
            changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Leave Without Saving
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
