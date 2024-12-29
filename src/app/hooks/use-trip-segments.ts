import { useState, useCallback } from 'react'
import type { Stop } from '@/types/routes'
import { toast } from 'sonner'

interface StopPairSegment {
  fromStopId: number
  toStopId: number
  distance: number | null
  segmentShape: string | null
}

interface UseTripSegmentsProps {
  onSegmentsFetched?: (segments: StopPairSegment[]) => void
}

export function useTripSegments({
  onSegmentsFetched,
}: UseTripSegmentsProps = {}) {
  const [segments, setSegments] = useState<StopPairSegment[]>([])
  const [isFetching, setIsFetching] = useState(false)

  const fetchSegment = useCallback(
    async (fromStop: Stop, toStop: Stop) => {
      // Check if segment already exists
      const existingSegment = segments.find(
        (s) =>
          (s.fromStopId === fromStop.stop_id &&
            s.toStopId === toStop.stop_id) ||
          (s.fromStopId === toStop.stop_id && s.toStopId === fromStop.stop_id),
      )

      if (existingSegment) {
        toast.info('Segment already exists')
        return
      }

      setIsFetching(true)

      try {
        const response = await fetch('/api/trips/segments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fromStopId: fromStop.stop_id,
            toStopId: toStop.stop_id,
            fromCoords: [fromStop.longitude, fromStop.latitude],
            toCoords: [toStop.longitude, toStop.latitude],
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch segment')
        }

        const { data } = await response.json()
        const newSegments = [...segments, data]
        setSegments(newSegments)
        onSegmentsFetched?.(newSegments)
        toast.success('Segment added successfully')
      } catch (error) {
        console.error('Error fetching segment:', error)
        toast.error('Failed to fetch segment')
      } finally {
        setIsFetching(false)
      }
    },
    [segments, onSegmentsFetched],
  )

  const removeSegment = useCallback(
    (fromStopId: number, toStopId: number) => {
      const newSegments = segments.filter(
        (s) =>
          !(
            (s.fromStopId === fromStopId && s.toStopId === toStopId) ||
            (s.fromStopId === toStopId && s.toStopId === fromStopId)
          ),
      )
      setSegments(newSegments)
      onSegmentsFetched?.(newSegments)
      toast.success('Segment removed')
    },
    [segments, onSegmentsFetched],
  )

  const clearSegments = useCallback(() => {
    setSegments([])
    onSegmentsFetched?.([])
  }, [onSegmentsFetched])

  return {
    segments,
    isFetching,
    fetchSegment,
    removeSegment,
    clearSegments,
  }
}
