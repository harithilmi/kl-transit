'use client'

import { Marker, Popup } from 'react-leaflet'
import type { Stop } from '@/types/routes'
import { getStopIcon } from '@/lib/map-utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface StopMarkerProps {
  stop: Stop & { sequence: number }
  isEditing?: boolean
  onEdit?: (stop: Stop & { sequence: number }) => void
}

export function StopMarker({ stop, isEditing, onEdit }: StopMarkerProps) {
  const icon = getStopIcon(stop.sequence)

  return (
    <Marker
      position={[stop.latitude, stop.longitude]}
      icon={icon}
      draggable={isEditing}
    >
      <Popup>
        <Card className="p-3">
          <h3 className="font-semibold">
            {stop.stop_name}{' '}
            <span className="text-sm text-muted-foreground">
              (Stop #{stop.sequence})
            </span>
          </h3>
          {stop.street_name && (
            <p className="text-sm text-muted-foreground">{stop.street_name}</p>
          )}
          {isEditing && onEdit && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onEdit(stop)}
              >
                Edit Stop
              </Button>
            </div>
          )}
        </Card>
      </Popup>
    </Marker>
  )
}
