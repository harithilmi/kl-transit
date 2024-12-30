'use client'

import {
  MapContainer,
  ZoomControl,
  Marker,
  useMap,
  Tooltip,
} from 'react-leaflet'
import L from 'leaflet'
import { useMemo, useState, useEffect } from 'react'
import type { Stop, StopPairSegment } from '@/types/routes'
import { Button } from '@/app/components/ui/button'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { MapPin, Eye, EyeOff } from 'lucide-react'
import { TileLayerComponent } from '@/app/components/map/tile-layer'
import { toast } from 'sonner'
import { SegmentLine } from './segment-line'
import { StopConnections } from './stop-connections'
import { useTripEditor } from './trip-editor-context'

import 'leaflet/dist/leaflet.css'
import 'leaflet-arrowheads'

// Create a different icon for non-trip stops
const NON_TRIP_STOP_ICON = L.divIcon({
  className: 'bg-transparent',
  html: `<div class="w-3 h-3 rounded-full bg-muted-foreground/70 border border-muted-foreground/70"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

// Create an icon for stops that are already in the trip
function createExistingTripStopIcon(sequences: number[]) {
  const totalWidth = sequences.length * 28 // Each sequence takes 28px total space
  const startX = -totalWidth / 2 // Center the sequence numbers

  const sequenceHtml = sequences
    .map(
      (seq) =>
        `<div class="absolute -translate-x-1/2 -top-7 min-w-[24px] h-5 px-1 rounded bg-blue-600 text-white text-xs font-medium flex items-center justify-center" style="transform: translateX(${
          startX + sequences.indexOf(seq) * 28
        }px)">#${seq}</div>`,
    )
    .join('')

  return L.divIcon({
    className: 'bg-transparent',
    html: `<div class="relative">
      <div class="absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-blue-600"></div>
      ${sequenceHtml}
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

interface ZoomBasedStopsProps {
  stop: Stop
  sequences: number[]
  showNonSequenceStops: boolean
  onStopClick: (stop: Stop) => void
  onSegmentClick: (stop: Stop) => void
}

function ZoomBasedStops({
  stop,
  sequences,
  showNonSequenceStops,
  onStopClick,
  onSegmentClick,
}: ZoomBasedStopsProps) {
  const map = useMap()
  const [isVisible, setIsVisible] = useState(false)
  const isInSequence = sequences.length > 0

  useEffect(() => {
    const updateVisibility = () => {
      const zoom = map.getZoom()
      // Always show sequence stops, only apply zoom check to non-sequence stops
      setIsVisible(isInSequence || (zoom >= 16 && showNonSequenceStops))
    }

    map.on('zoomend', updateVisibility)
    updateVisibility()

    return () => {
      map.off('zoomend', updateVisibility)
    }
  }, [map, isInSequence, showNonSequenceStops])

  if (!isVisible) return null

  return (
    <Marker
      position={[stop.latitude, stop.longitude]}
      icon={
        isInSequence
          ? createExistingTripStopIcon(sequences)
          : NON_TRIP_STOP_ICON
      }
      eventHandlers={{
        click: () => (isInSequence ? onSegmentClick(stop) : onStopClick(stop)),
      }}
    >
      <StopTooltip stop={stop} sequences={sequences} />
    </Marker>
  )
}

function StopTooltip({
  stop,
  sequences,
}: {
  stop: Stop
  sequences?: number[]
}) {
  return (
    <Tooltip direction="top" offset={[0, -20]} permanent={false}>
      <div className="rounded-md bg-background/80 backdrop-blur-sm border border-border shadow-sm p-1.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {stop.stop_code && (
              <span className="px-1.5 py-0.5 bg-primary rounded text-primary-foreground text-xs font-medium">
                {stop.stop_code}
              </span>
            )}
            <span className="text-sm font-medium text-foreground">
              {stop.stop_name}
            </span>
          </div>
          {sequences && sequences.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {sequences.map((seq) => (
                <span
                  key={seq}
                  className="px-1.5 py-0.5 bg-blue-600 rounded text-white text-xs font-medium"
                >
                  #{seq}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Tooltip>
  )
}

interface TripMapEditProps {
  stops: Stop[]
  onSegmentsChange?: (segments: StopPairSegment[]) => void
  onStopSequenceChange?: (
    stops: Array<{ stopId: number; fareZone: number }>,
    segments?: StopPairSegment[],
  ) => void
  allStops?: Stop[]
}

export function TripMapEdit({
  stops,
  onSegmentsChange,
  onStopSequenceChange,
  allStops = [],
}: TripMapEditProps) {
  const { setHasUnsavedChanges } = useTripEditor()
  const [segments, setSegments] = useState<StopPairSegment[]>([])
  const [pendingStops, setPendingStops] = useState<
    Array<{ stopId: number; fareZone: number }>
  >(stops.map((stop) => ({ stopId: stop.stop_id, fareZone: 1 })))
  const [showNonSequenceStops, setShowNonSequenceStops] = useState(false)
  const [
    selectedStopForSegment,
    setSelectedStopForSegment,
  ] = useState<Stop | null>(null)
  const [isGeneratingSegment, setIsGeneratingSegment] = useState(false)

  const bounds = useMemo(() => {
    if (stops.length === 0) return undefined

    const lats = stops.map((stop) => stop.latitude)
    const lngs = stops.map((stop) => stop.longitude)

    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ] as [[number, number], [number, number]]
  }, [stops])

  const handleSegmentsChange = (newSegments: StopPairSegment[]) => {
    setSegments(newSegments)
    onSegmentsChange?.(newSegments)
    onStopSequenceChange?.(pendingStops, newSegments)
    setHasUnsavedChanges(true)
  }

  const handleStopClick = async (stop: Stop) => {
    // If no stop is selected, select this one
    if (!selectedStopForSegment) {
      setSelectedStopForSegment(stop)
      toast.info('Select another stop to create a segment')
      return
    }

    // Early return if same stop
    if (selectedStopForSegment.stop_id === stop.stop_id) {
      setSelectedStopForSegment(null)
      return
    }

    // Check if these stops are adjacent in the sequence
    const stopIds = stops.map((s) => s.stop_id)
    const fromStopId = selectedStopForSegment?.stop_id
    if (!fromStopId) {
      setSelectedStopForSegment(null)
      return
    }

    const fromIndex = stopIds.indexOf(fromStopId)
    const toIndex = stopIds.indexOf(stop.stop_id)

    if (Math.abs(fromIndex - toIndex) !== 1) {
      toast.error('Please select adjacent stops')
      setSelectedStopForSegment(null)
      return
    }

    // Find the actual stop objects to ensure we have all required data
    const fromStop = stops.find((s) => s.stop_id === fromStopId)
    const toStop = stop

    if (
      !fromStop?.longitude ||
      !fromStop?.latitude ||
      !toStop.longitude ||
      !toStop.latitude
    ) {
      toast.error('Invalid stop coordinates')
      setSelectedStopForSegment(null)
      return
    }

    try {
      setIsGeneratingSegment(true)
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

      const { data } = (await response.json()) as {
        success: boolean
        data: StopPairSegment
        error?: string
      }

      if (!data) {
        throw new Error('No data returned from API')
      }

      const newSegments = [...segments, data]
      handleSegmentsChange(newSegments)
      toast.success('Segment added successfully')
    } catch (error) {
      console.error('Error fetching segment:', error)
      toast.error('Failed to fetch segment')
    } finally {
      setIsGeneratingSegment(false)
      setSelectedStopForSegment(null)
    }
  }

  const handleAddStop = async (stop: Stop) => {
    try {
      // Check if this stop is the last stop in sequence
      const lastStop = pendingStops[pendingStops.length - 1]
      if (lastStop?.stopId === stop.stop_id) {
        // If it is the last stop, remove it
        const newStops = pendingStops.slice(0, -1)
        setPendingStops(newStops)
        onStopSequenceChange?.(newStops, segments)
        setHasUnsavedChanges(true)
        toast.success('Stop removed')
        return
      }

      // Don't allow adding the same stop consecutively
      if (pendingStops.length > 0 && lastStop?.stopId === stop.stop_id) {
        toast.error('Cannot add the same stop consecutively')
        return
      }

      const newStops = [...pendingStops, { stopId: stop.stop_id, fareZone: 1 }]
      setPendingStops(newStops)
      onStopSequenceChange?.(newStops, segments)
      setHasUnsavedChanges(true)

      // If there's a previous stop, try to generate a segment automatically
      if (lastStop) {
        const fromStop = stops.find((s) => s.stop_id === lastStop.stopId)
        const toStop = stop

        if (fromStop) {
          setIsGeneratingSegment(true)
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

            const { data } = (await response.json()) as {
              success: boolean
              data: StopPairSegment
              error?: string
            }

            if (!data) {
              throw new Error('No data returned from API')
            }

            const newSegments = [...segments, data]
            handleSegmentsChange(newSegments)
            toast.success('Route shape generated automatically')
          } catch (error) {
            console.error('Error generating segment:', error)
            toast.error('Failed to generate segment automatically')
          } finally {
            setIsGeneratingSegment(false)
          }
        }
      }

      toast.success('Stop added')
    } catch (error) {
      console.error('Error in handleAddStop:', error)
      toast.error('Failed to add stop')
    }
  }

  const handleRemoveSegment = (fromStopId: number, toStopId: number) => {
    const newSegments = segments.filter(
      (s) =>
        !(
          (s.fromStopId === fromStopId && s.toStopId === toStopId) ||
          (s.fromStopId === toStopId && s.toStopId === fromStopId)
        ),
    )
    handleSegmentsChange(newSegments)
    toast.success('Segment removed')
  }

  // Create a map of stop IDs to their sequences
  const stopSequences = useMemo(() => {
    const sequences = new Map<number, number[]>()
    stops.forEach((stop, index) => {
      const existing = sequences.get(stop.stop_id) ?? []
      sequences.set(stop.stop_id, [...existing, index + 1])
    })
    return sequences
  }, [stops])

  const handleGenerateShape = async (fromStop: Stop, toStop: Stop) => {
    try {
      setIsGeneratingSegment(true)
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
        const errorData = (await response.json()) as { error: string }
        throw new Error(errorData.error || 'Failed to fetch segment')
      }

      const { data } = (await response.json()) as {
        success: boolean
        data: StopPairSegment
        error?: string
      }

      if (!data) {
        throw new Error('No data returned from API')
      }

      const newSegments = [...segments, data]
      handleSegmentsChange(newSegments)
      toast.success('Route shape generated successfully')
    } catch (error) {
      console.error('Error generating route shape:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to generate route shape',
      )
    } finally {
      setIsGeneratingSegment(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:gap-4 h-[800px]">
      {/* Sidebar */}
      <div className="h-[400px] md:h-full">
        {/* Stop List */}
        <div className="rounded-lg border h-full">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h2 className="font-semibold">Stops</h2>
              <p className="text-sm text-muted-foreground">
                {stops.length} stops in sequence
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowNonSequenceStops(!showNonSequenceStops)}
              title={
                showNonSequenceStops
                  ? 'Hide non-sequence stops'
                  : 'Show non-sequence stops'
              }
            >
              {showNonSequenceStops ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-4 space-y-2">
              {stops.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <p>No stops found for this trip.</p>
                  <p className="text-sm">
                    Click on stops on the map to add them to the sequence
                  </p>
                </div>
              ) : (
                stops.map((stop, index) => {
                  const nextStop =
                    index < stops.length - 1 ? stops[index + 1] : null
                  const hasSegmentWithNext = nextStop
                    ? segments.some(
                        (segment: StopPairSegment) =>
                          (segment.fromStopId === stop.stop_id &&
                            segment.toStopId === nextStop.stop_id) ||
                          (segment.fromStopId === nextStop.stop_id &&
                            segment.toStopId === stop.stop_id),
                      )
                    : false

                  return (
                    <div
                      key={`${stop.stop_id}-${index}`}
                      className="group rounded-lg border bg-card p-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex h-5 min-w-[20px] items-center justify-center rounded bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                              {index + 1}
                            </div>
                            <h3 className="font-medium leading-none">
                              {stop.stop_name}
                            </h3>
                          </div>
                          {stop.street_name && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {stop.street_name}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Connection to next stop */}
                      {nextStop && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-px flex-1 bg-border" />
                            <span>
                              {hasSegmentWithNext ? (
                                <span className="text-green-600">
                                  Route shape added
                                </span>
                              ) : (
                                <span className="text-yellow-600">
                                  No route shape
                                </span>
                              )}
                            </span>
                            <div className="h-px flex-1 bg-border" />
                          </div>

                          <div className="flex items-center gap-2">
                            {!hasSegmentWithNext ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  if (!nextStop) return
                                  void handleGenerateShape(stop, nextStop)
                                }}
                              >
                                Generate route shape
                              </Button>
                            ) : (
                              <div className="flex w-full gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() =>
                                    handleRemoveSegment(
                                      stop.stop_id,
                                      nextStop.stop_id,
                                    )
                                  }
                                >
                                  Remove shape
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    // TODO: Add shape editing
                                  }}
                                >
                                  Edit shape
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 h-[500px] md:h-full rounded-lg border mt-4 md:mt-0 relative">
        <MapContainer
          bounds={bounds}
          className="h-full w-full rounded-lg"
          zoomControl={false}
          minZoom={10}
          maxZoom={18}
        >
          <TileLayerComponent isSatellite={false} />

          {/* Render stop connections */}
          <StopConnections
            stops={stops.map((stop, index) => ({
              ...stop,
              sequence: index + 1,
            }))}
            segments={segments}
            showArrows
          />

          {/* Render all stops */}
          {allStops.map((stop) => {
            const sequences = stopSequences.get(stop.stop_id) ?? []
            return (
              <ZoomBasedStops
                key={stop.stop_id}
                stop={stop}
                sequences={sequences}
                showNonSequenceStops={showNonSequenceStops}
                onStopClick={handleAddStop}
                onSegmentClick={handleStopClick}
              />
            )
          })}

          {/* Render segments */}
          {segments.map((segment) => (
            <SegmentLine
              key={`${segment.fromStopId}-${segment.toStopId}`}
              segment={segment}
              stops={stops}
            />
          ))}

          <ZoomControl position="bottomright" />
        </MapContainer>
      </div>
    </div>
  )
}
