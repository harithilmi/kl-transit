'use client'

import type { Stop } from '@/types/routes'
import { Tooltip as LeafletTooltip, Marker, Popup } from 'react-leaflet'
import { Input } from '@/components/ui/input'
import L from 'leaflet'
import type { DragEndEvent } from 'leaflet'
import { Button } from '@/components/ui/button'
import { ChevronDown, RefreshCcw, Trash2, Focus } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useStopEditor } from './stop-editor-context'
import type { StopFormValues } from './stop-editor-context'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export const createStopIcon = (color: string, opacity: number) => {
  return L.divIcon({
    html: `<svg width="24" height="24" viewBox="0 0 36.352 36.352" style="opacity: ${opacity}">
		<path d="M36.345 33.122C36.345 34.906 34.9 36.352 33.116 36.352L3.224 36.352C1.44 36.352 0 34.906 0 33.122L0 3.237C0 1.446 1.44 0 3.224 0L33.116 0C34.9 0 36.345 1.446 36.345 3.237L36.345 33.122Z" fill="${color}"/>
		<path d="M24.7482 28.0342L11.6038 28.0342L11.6038 29.3487C11.6038 30.0746 11.0154 30.6631 10.2894 30.6631L8.97499 30.6631C8.24905 30.6631 7.66056 30.0746 7.66056 29.3487L7.66056 28.0342L6.34613 28.0342L6.34613 17.5188L5.03169 17.5188L5.03169 12.2611L6.34613 12.2611L6.34613 8.31777C6.34613 6.86589 7.52311 5.68891 8.97499 5.68891L27.377 5.68891C28.8289 5.68891 30.0059 6.86589 30.0059 8.31777L30.0059 12.2611L31.3203 12.2611L31.3203 17.5188L30.0059 17.5188L30.0059 28.0342L28.6914 28.0342L28.6914 29.3487C28.6914 30.0746 28.103 30.6631 27.377 30.6631L26.0626 30.6631C25.3366 30.6631 24.7482 30.0746 24.7482 29.3487L24.7482 28.0342ZM8.97499 8.31777L8.97499 20.1476L27.377 20.1476L27.377 8.31777L8.97499 8.31777ZM8.97499 22.7765L8.97499 25.4054L14.2327 25.4054L14.2327 22.7765L8.97499 22.7765ZM22.1193 22.7765L22.1193 25.4054L27.377 25.4054L27.377 22.7765L22.1193 22.7765Z" fill="#ffffff"/>
	  </svg>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

export function EditPopup({
  stop,
  isNewStop,
  handleDelete,
  isEdited,
  onResetPosition,
}: {
  stop: Stop
  isNewStop?: boolean
  handleDelete?: (stopId: number) => void
  isEdited?: boolean
  onResetPosition?: () => void
}): JSX.Element {
  const { handleNewStopEdit, handleStopReset, handleStopEdit } = useStopEditor()

  const handleInputChange = (
    field: keyof StopFormValues,
    value: string | number | null,
  ) => {
    const values: StopFormValues = {
      rapid_stop_id: null,
      mrt_stop_id: null,
    }

    // Set the changed field
    switch (field) {
      case 'stop_code':
      case 'stop_name':
      case 'street_name':
        values[field] = value as string
        break
      case 'rapid_stop_id':
      case 'mrt_stop_id':
        values[field] = value as number | null
        break
    }

    if (isNewStop) {
      handleNewStopEdit(stop.stop_id, values)
    } else {
      handleStopEdit(stop.stop_id, values)
    }
  }

  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${stop.latitude},${stop.longitude}`

  const basicFields: Array<{ name: keyof StopFormValues; label: string }> = [
    { name: 'stop_code', label: 'Stop Code' },
    { name: 'stop_name', label: 'Stop Name' },
    { name: 'street_name', label: 'Street Name' },
  ]

  const advancedFields: Array<{ name: keyof StopFormValues; label: string }> = [
    { name: 'rapid_stop_id', label: 'Rapid Stop ID' },
    { name: 'mrt_stop_id', label: 'MRT Stop ID' },
  ]

  const getStopValue = (name: keyof StopFormValues) => {
    switch (name) {
      case 'stop_code':
        return stop.stop_code ?? ''
      case 'stop_name':
        return stop.stop_name ?? ''
      case 'street_name':
        return stop.street_name ?? ''
      case 'rapid_stop_id':
        return stop.rapid_stop_id ?? ''
      case 'mrt_stop_id':
        return stop.mrt_stop_id ?? ''
      default:
        return ''
    }
  }

  return (
    <Popup>
      <div className="w-64 space-y-2 rounded-lg bg-background p-3 text-md text-foreground translate-y-[-1rem]">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-center flex items-center gap-2">
            <span>Edit Stop</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (isNewStop) {
                        handleNewStopEdit(stop.stop_id, {
                          stop_code: stop.stop_code ?? '',
                          stop_name: stop.stop_name ?? '',
                          street_name: stop.street_name ?? '',
                          rapid_stop_id: stop.rapid_stop_id ?? null,
                          mrt_stop_id: stop.mrt_stop_id ?? null,
                        })
                      } else {
                        handleStopReset(stop.stop_id)
                      }
                    }}
                  >
                    <RefreshCcw className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset changes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    className="h-8 w-8"
                  >
                    <a
                      href={streetViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Focus className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open in Street View</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h1>
        </div>

        {/* Basic Fields */}
        <div className="space-y-2">
          {basicFields.map(({ name, label }) => (
            <div key={name} className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
              </label>
              <Input
                placeholder={`Enter ${label.toLowerCase()}`}
                defaultValue={getStopValue(name)}
                onChange={(e) => handleInputChange(name, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Advanced Fields */}
        {!isNewStop && (
          <Collapsible className="border-t border-border">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between py-2"
                type="button"
              >
                <span className="text-muted-foreground">Advanced Fields</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              {advancedFields.map(({ name, label }) => (
                <div key={name} className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                  </label>
                  <Input
                    type="number"
                    placeholder={`Enter ${label.toLowerCase()}`}
                    defaultValue={getStopValue(name)}
                    onChange={(e) =>
                      handleInputChange(
                        name,
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                  />
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="flex gap-2">
          {isEdited && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onResetPosition}
            >
              Reset Position
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            onClick={() => handleDelete?.(stop.stop_id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Popup>
  )
}

const defaultMarkerIcon = createStopIcon('#f7a11a', 0.6)
const selectedMarkerIcon = createStopIcon('#f7a11a', 1)
const deletedMarkerIcon = createStopIcon('#ff0000', 1)
const editedMarkerIcon = createStopIcon('#22c55e', 1)

export function StopMarker({
  stop,
  isDraggable,
  onDragEnd,
  onClick,
  isNewStop,
}: {
  stop: Stop
  isDraggable?: boolean
  onDragEnd?: (stopId: number, lat: number, lng: number) => void
  onClick?: (stopId: number) => void
  isNewStop?: boolean
}) {
  const {
    handleStopDelete,
    handleStopRestore,
    handleStopMove,
    handleStopResetPosition,
    handleNewStopDelete,
    editedStops,
    deletedStops,
  } = useStopEditor()

  const isDeleted = !isNewStop && deletedStops.has(stop.stop_id)
  const editedStop = editedStops.get(stop.stop_id)
  const isEdited = Boolean(editedStop?.latitude && editedStop?.longitude)
  const position: [number, number] = [
    editedStop?.latitude ?? stop.latitude,
    editedStop?.longitude ?? stop.longitude,
  ]

  return (
    <Marker
      draggable={isDraggable && !isDeleted}
      icon={
        isDeleted
          ? deletedMarkerIcon
          : isNewStop
          ? selectedMarkerIcon
          : isEdited
          ? editedMarkerIcon
          : isDraggable
          ? selectedMarkerIcon
          : defaultMarkerIcon
      }
      position={position}
      eventHandlers={{
        click: () => {
          if (!isDeleted) {
            onClick?.(stop.stop_id)
          }
        },
        dragend: (e: DragEndEvent) => {
          const marker = e.target as L.Marker
          const latlng = marker.getLatLng()
          handleStopMove(stop.stop_id, latlng.lat, latlng.lng)
          onDragEnd?.(stop.stop_id, latlng.lat, latlng.lng)
        },
      }}
    >
      {!isDeleted ? (
        <EditPopup
          stop={stop}
          isNewStop={isNewStop}
          handleDelete={isNewStop ? handleNewStopDelete : handleStopDelete}
          isEdited={isEdited}
          onResetPosition={() => handleStopResetPosition(stop.stop_id)}
        />
      ) : (
        <Popup>
          <div className="w-64 space-y-2 rounded-lg bg-background p-3 text-md text-foreground translate-y-[-1rem]">
            <h1 className="text-lg font-bold text-center">Deleted Stop</h1>
            <div className="flex items-center gap-2">
              {stop.stop_code && (
                <p className="px-2 py-1 bg-primary rounded-md text-primary-foreground font-medium">
                  {stop.stop_code}
                </p>
              )}
              <p className="text-sm font-medium text-foreground">
                {stop.stop_name}
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => handleStopRestore(stop.stop_id)}
            >
              Restore Stop
            </Button>
          </div>
        </Popup>
      )}
      <LeafletTooltip
        direction="top"
        offset={[0, -15]}
        permanent={false}
        className={`shadcn-tooltip`}
      >
        <div className="flex items-center gap-2 p-2 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 rounded-lg bg-background text-foreground translate-y-1">
          {stop.stop_code && (
            <p className="px-2 py-1 bg-primary rounded-md text-primary-foreground font-medium">
              {stop.stop_code}
            </p>
          )}
          <p className="text-sm font-medium text-foreground">
            {isDeleted ? '(Deleted) ' : ''}
            {stop.stop_name}
          </p>
        </div>
      </LeafletTooltip>
    </Marker>
  )
}
