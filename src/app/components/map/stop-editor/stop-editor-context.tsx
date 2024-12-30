'use client'

import { createContext, useContext, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

export interface StopFormValues {
  stop_code?: string
  stop_name?: string
  street_name?: string
  rapid_stop_id: number | null
  mrt_stop_id: number | null
  latitude?: number
  longitude?: number
  changedFields?: Set<string>
}

export interface NewStop {
  stop_id: number
  stop_code: string
  stop_name: string
  street_name: string
  latitude: number
  longitude: number
  old_stop_id: string
}

// Add a type for form submission values
export interface StopFormSubmission extends StopFormValues {
  changedFields: Set<string>
}

interface StopEditorContextType {
  // State
  newStops: NewStop[]
  editedStops: Map<number, StopFormValues>
  deletedStops: Set<number>
  selectedStopId: number | null
  isAddingStop: boolean
  isSatellite: boolean
  isEditMenuOpen: boolean
  isSubmitting: boolean
  hasUnsavedChanges: boolean

  // Actions
  setSelectedStopId: (id: number | null) => void
  setIsAddingStop: (isAdding: boolean) => void
  setIsSatellite: (isSatellite: boolean) => void
  setIsEditMenuOpen: (isOpen: boolean) => void
  handleStopEdit: (stopId: number, values: StopFormValues) => void
  handleStopMove: (stopId: number, lat: number, lng: number) => void
  handleStopResetPosition: (stopId: number) => void
  handleStopDelete: (stopId: number) => void
  handleStopRestore: (stopId: number) => void
  handleNewStopAdd: (stop: NewStop) => void
  handleNewStopEdit: (stopId: number, values: StopFormValues) => void
  handleNewStopDelete: (stopId: number) => void
  handleSubmitChanges: () => Promise<void>
  handleStopReset: (stopId: number) => void
}

const StopEditorContext = createContext<StopEditorContextType | null>(null)

export function StopEditorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = useAuth()
  const [newStops, setNewStops] = useState<NewStop[]>([])
  const [editedStops, setEditedStops] = useState<Map<number, StopFormValues>>(
    new Map(),
  )
  const [deletedStops, setDeletedStops] = useState<Set<number>>(new Set())
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null)
  const [isAddingStop, setIsAddingStop] = useState(false)
  const [isSatellite, setIsSatellite] = useState(false)
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const checkAuth = () => {
    if (!userId) {
      toast.error('You must be logged in to perform this action')
      return false
    }
    return true
  }

  const handleStopEdit = (stopId: number, values: StopFormValues) => {
    if (!checkAuth()) return

    const existingValues = editedStops.get(stopId) ?? {
      rapid_stop_id: null,
      mrt_stop_id: null,
      changedFields: new Set<string>(),
    }

    // Track which fields have changed from their original values
    const changedFields = new Set(existingValues.changedFields)

    // Only add to changedFields if the value is different from the original
    const originalStop = Array.from(editedStops.entries()).find(
      ([id]) => id === stopId,
    )?.[1]
    if (
      values.stop_code !== undefined &&
      values.stop_code !== originalStop?.stop_code
    )
      changedFields.add('stop_code')
    if (
      values.stop_name !== undefined &&
      values.stop_name !== originalStop?.stop_name
    )
      changedFields.add('stop_name')
    if (
      values.street_name !== undefined &&
      values.street_name !== originalStop?.street_name
    )
      changedFields.add('street_name')
    if (
      values.rapid_stop_id !== undefined &&
      values.rapid_stop_id !== originalStop?.rapid_stop_id
    )
      changedFields.add('rapid_stop_id')
    if (
      values.mrt_stop_id !== undefined &&
      values.mrt_stop_id !== originalStop?.mrt_stop_id
    )
      changedFields.add('mrt_stop_id')

    setEditedStops(
      new Map(editedStops.set(stopId, { ...values, changedFields })),
    )
  }

  const handleStopDelete = (stopId: number) => {
    if (!checkAuth()) return

    setDeletedStops(new Set(deletedStops.add(stopId)))
    setSelectedStopId(null)
  }

  const handleStopRestore = (stopId: number) => {
    const newDeletedStops = new Set(deletedStops)
    newDeletedStops.delete(stopId)
    setDeletedStops(newDeletedStops)
  }

  const handleNewStopAdd = (stop: NewStop) => {
    if (!checkAuth()) return

    setNewStops([...newStops, stop])
    setIsAddingStop(false)
    setSelectedStopId(stop.stop_id)
  }

  const handleNewStopEdit = (stopId: number, values: StopFormValues) => {
    setNewStops(
      newStops.map((stop) =>
        stop.stop_id === stopId
          ? {
              ...stop,
              ...values,
            }
          : stop,
      ),
    )
  }

  const handleNewStopDelete = (stopId: number) => {
    setNewStops(newStops.filter((stop) => stop.stop_id !== stopId))
    setSelectedStopId(null)
  }

  const handleSubmitChanges = async () => {
    if (!checkAuth()) return

    try {
      setIsSubmitting(true)

      // Prepare the changes for submission
      const suggestions = [
        ...newStops.map((stop) => ({
          type: 'new' as const,
          temporaryId: String(stop.stop_id),
          stopCode: stop.stop_code,
          stopName: stop.stop_name,
          streetName: stop.street_name,
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
        ...Array.from(editedStops.entries()).map(([stopId, changes]) => ({
          type: 'edit' as const,
          stopId: String(stopId),
          changes: {
            stop_code: changes.stop_code,
            stop_name: changes.stop_name,
            street_name: changes.street_name,
            latitude: changes.latitude,
            longitude: changes.longitude,
            rapid_stop_id: changes.rapid_stop_id,
            mrt_stop_id: changes.mrt_stop_id,
          },
        })),
        ...Array.from(deletedStops).map((stopId) => ({
          type: 'delete' as const,
          stopId: String(stopId),
        })),
      ]

      // Submit changes to the API
      const response = await fetch('/api/stops/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestions }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit changes')
      }

      // Reset state after successful submission
      setNewStops([])
      setEditedStops(new Map())
      setDeletedStops(new Set())
      setSelectedStopId(null)
    } catch (error) {
      console.error('Error submitting changes:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStopMove = (stopId: number, lat: number, lng: number) => {
    const currentValues = editedStops.get(stopId) ?? {
      rapid_stop_id: null,
      mrt_stop_id: null,
      changedFields: new Set<string>(),
    }

    const changedFields = new Set(currentValues.changedFields)
    changedFields.add('latitude')
    changedFields.add('longitude')

    setEditedStops(
      new Map(
        editedStops.set(stopId, {
          ...currentValues,
          latitude: lat,
          longitude: lng,
          changedFields,
        }),
      ),
    )
  }

  const handleStopResetPosition = (stopId: number) => {
    const currentValues = editedStops.get(stopId)
    if (currentValues) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { latitude, longitude, ...rest } = currentValues
      if (
        Object.keys(rest).length === 2 &&
        rest.rapid_stop_id === null &&
        rest.mrt_stop_id === null
      ) {
        // If only default values remain, remove the stop entirely
        const newEditedStops = new Map(editedStops)
        newEditedStops.delete(stopId)
        setEditedStops(newEditedStops)
      } else {
        setEditedStops(new Map(editedStops.set(stopId, rest)))
      }
    }
  }

  const handleStopReset = (stopId: number) => {
    const existingValues = editedStops.get(stopId)
    if (existingValues) {
      // If there are only position changes, remove the stop entirely
      if (
        Object.keys(existingValues).length === 3 && // changedFields + lat + lng
        existingValues.changedFields?.size === 2 && // only lat and lng changed
        existingValues.changedFields?.has('latitude') &&
        existingValues.changedFields?.has('longitude')
      ) {
        const newEditedStops = new Map(editedStops)
        newEditedStops.delete(stopId)
        setEditedStops(newEditedStops)
      } else {
        // Otherwise, just clear the changed fields
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { latitude, longitude, ...rest } = existingValues
        setEditedStops(
          new Map(
            editedStops.set(stopId, {
              ...rest,
              changedFields: new Set<string>(),
            }),
          ),
        )
      }
    }
  }

  const value = {
    // State
    newStops,
    editedStops,
    deletedStops,
    selectedStopId,
    isAddingStop,
    isSatellite,
    isEditMenuOpen,
    isSubmitting,
    hasUnsavedChanges,

    // Actions
    setSelectedStopId,
    setIsAddingStop,
    setIsSatellite,
    setIsEditMenuOpen,
    handleStopEdit,
    handleStopDelete,
    handleStopRestore,
    handleNewStopAdd,
    handleNewStopEdit,
    handleNewStopDelete,
    handleSubmitChanges,
    handleStopMove,
    handleStopResetPosition,
    handleStopReset,
  }

  return (
    <StopEditorContext.Provider value={value}>
      {children}
    </StopEditorContext.Provider>
  )
}

export function useStopEditor() {
  const context = useContext(StopEditorContext)
  if (!context) {
    throw new Error('useStopEditor must be used within a StopEditorProvider')
  }
  return context
}
