'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { StopPairSegment } from '@/types/routes'

interface TripEditorContextType {
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (value: boolean) => void
  pendingStopDetails: Array<{ stopId: number; fareZone: number }>
  setPendingStopDetails: (
    value: Array<{ stopId: number; fareZone: number }>,
  ) => void
  pendingSegments: StopPairSegment[]
  setPendingSegments: (value: StopPairSegment[]) => void
  isSaving: boolean
  setIsSaving: (value: boolean) => void
}

const TripEditorContext = createContext<TripEditorContextType | null>(null)

export function TripEditorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingStopDetails, setPendingStopDetails] = useState<
    Array<{ stopId: number; fareZone: number }>
  >([])
  const [pendingSegments, setPendingSegments] = useState<StopPairSegment[]>([])
  const [isSaving, setIsSaving] = useState(false)

  return (
    <TripEditorContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        pendingStopDetails,
        setPendingStopDetails,
        pendingSegments,
        setPendingSegments,
        isSaving,
        setIsSaving,
      }}
    >
      {children}
    </TripEditorContext.Provider>
  )
}

export function useTripEditor() {
  const context = useContext(TripEditorContext)
  if (!context) {
    throw new Error('useTripEditor must be used within a TripEditorProvider')
  }
  return context
}
