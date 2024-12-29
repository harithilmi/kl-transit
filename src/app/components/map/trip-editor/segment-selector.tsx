import { Button } from '@/app/components/ui/button'
import { useTripSegments } from '@/app/hooks/use-trip-segments'
import type { Stop } from '@/types/routes'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

interface SegmentSelectorProps {
  stops: Stop[]
  onSegmentsChange: (
    segments: Array<{
      fromStopId: number
      toStopId: number
      distance: number | null
      segmentShape: string | null
    }>,
  ) => void
}

export function SegmentSelector({
  stops,
  onSegmentsChange,
}: SegmentSelectorProps) {
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null)
  const { segments, isFetching, fetchSegment, removeSegment } = useTripSegments(
    {
      onSegmentsFetched: onSegmentsChange,
    },
  )

  const handleStopClick = useCallback(
    async (stop: Stop) => {
      if (!selectedStop) {
        setSelectedStop(stop)
        return
      }

      if (selectedStop.stop_id === stop.stop_id) {
        setSelectedStop(null)
        return
      }

      // Check if these stops are adjacent in the sequence
      const stopIds = stops.map((s) => s.stop_id)
      const fromIndex = stopIds.indexOf(selectedStop.stop_id)
      const toIndex = stopIds.indexOf(stop.stop_id)

      if (Math.abs(fromIndex - toIndex) !== 1) {
        toast.error('Please select adjacent stops')
        setSelectedStop(null)
        return
      }

      await fetchSegment(selectedStop, stop)
      setSelectedStop(null)
    },
    [selectedStop, stops, fetchSegment],
  )

  const handleRemoveSegment = useCallback(
    (fromStopId: number, toStopId: number) => {
      removeSegment(fromStopId, toStopId)
    },
    [removeSegment],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">
          {selectedStop
            ? 'Select the next stop to create a segment'
            : 'Select a stop to start creating a segment'}
        </h3>
        {isFetching && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
      </div>

      <div className="grid gap-2">
        {stops.map((stop, index) => {
          const isSelected = selectedStop?.stop_id === stop.stop_id
          const hasSegmentWithNext =
            index < stops.length - 1 &&
            segments.some(
              (s) =>
                (s.fromStopId === stop.stop_id &&
                  s.toStopId === stops[index + 1].stop_id) ||
                (s.fromStopId === stops[index + 1].stop_id &&
                  s.toStopId === stop.stop_id),
            )

          return (
            <div key={stop.stop_id} className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => handleStopClick(stop)}
                disabled={isFetching}
              >
                {stop.stop_name}
              </Button>

              {hasSegmentWithNext && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    handleRemoveSegment(stop.stop_id, stops[index + 1].stop_id)
                  }
                >
                  Remove segment
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
