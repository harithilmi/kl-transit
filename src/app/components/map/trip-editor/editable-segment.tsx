'use client'

import { Polyline } from 'react-leaflet'
import type { Stop, StopPairSegment } from '@/types/routes'
import { decode } from '@googlemaps/polyline-codec'
import { useState, useCallback } from 'react'
import type { LatLng } from 'leaflet'

interface EditableSegmentProps {
  segment: StopPairSegment
  stops: Stop[]
  onSegmentChange?: (segment: StopPairSegment) => void
}

export function EditableSegment({
  segment,
  stops,
}: EditableSegmentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedPoints, setEditedPoints] = useState<LatLng[]>([])

  const fromStop = stops.find((s) => s.stop_id === segment.fromStopId)
  const toStop = stops.find((s) => s.stop_id === segment.toStopId)

  if (!segment.segmentShape || !fromStop || !toStop) return null

  const decodedCoords = decode(segment.segmentShape).map(
    ([lat, lng]) => [lat, lng] as [number, number],
  )

  const handleEdit = useCallback(() => {
    setIsEditing(true)
    // Initialize with current points
    setEditedPoints(
      decodedCoords.map((coord) => new L.LatLng(coord[0], coord[1])),
    )
  }, [decodedCoords])

  const handleDragPoint = useCallback(
    (index: number, newPos: LatLng) => {
      const newPoints = [...editedPoints]
      newPoints[index] = newPos
      setEditedPoints(newPoints)
    },
    [editedPoints],
  )

  const handleSave = useCallback(() => {
    setIsEditing(false)
    // TODO: Encode points back to polyline and save
  }, [])

  return (
    <>
      <Polyline
        positions={decodedCoords}
        pathOptions={{
          color: '#0ea5e9',
          weight: 3,
          opacity: isEditing ? 0.5 : 1,
        }}
        eventHandlers={{
          click: () => {
            if (!isEditing) handleEdit()
          },
        }}
      />

      {isEditing &&
        editedPoints.map((point, index) => (
          <Marker
            key={`edit-point-${index}`}
            position={point}
            draggable
            eventHandlers={{
              dragend: (e) => handleDragPoint(index, e.target.getLatLng()),
            }}
            icon={L.divIcon({
              className: 'bg-transparent',
              html: `<div class="w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            })}
          />
        ))}
    </>
  )
}
