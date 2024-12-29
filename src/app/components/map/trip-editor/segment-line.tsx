import { Polyline } from 'react-leaflet'
import type { Stop, StopPairSegment } from '@/types/routes'
import { decode } from '@googlemaps/polyline-codec'

interface SegmentLineProps {
  segment: StopPairSegment
  stops: Stop[]
}

export function SegmentLine({ segment, stops }: SegmentLineProps) {
  if (!segment.segmentShape) return null

  const fromStop = stops.find((s) => s.stop_id === segment.fromStopId)
  const toStop = stops.find((s) => s.stop_id === segment.toStopId)

  if (!fromStop || !toStop) return null

  const decodedCoords = decode(segment.segmentShape).map(
    ([lat, lng]) => [lat, lng] as [number, number],
  )

  return (
    <Polyline
      key={`${segment.fromStopId}-${segment.toStopId}`}
      positions={decodedCoords}
      color="#0ea5e9"
      weight={3}
    />
  )
}
