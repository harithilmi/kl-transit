'use client'

import { useStopEditor } from './stop-editor-context'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Stop } from '@/types/routes'

interface DisplayChanges {
  stop_code?: string
  stop_name?: string
  street_name?: string
}

function StopChangesList({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{title}</h3>
        <Badge variant="secondary">{count}</Badge>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function StopChangesItem({
  stopCode,
  stopName,
  streetName,
  type,
  changes,
  originalStop,
  changedFields,
}: {
  stopCode?: string
  stopName?: string
  streetName?: string
  type: 'new' | 'edit' | 'delete'
  changes?: DisplayChanges
  originalStop?: Stop
  changedFields?: Set<string>
}) {
  // For edited stops, show changes in a different style
  const showChanges = type === 'edit' && changes
  const hasNameChange =
    showChanges &&
    changedFields?.has('stop_name') &&
    changes.stop_name !== originalStop?.stop_name
  const hasCodeChange =
    showChanges &&
    changedFields?.has('stop_code') &&
    changes.stop_code !== originalStop?.stop_code
  const hasStreetChange =
    showChanges &&
    changedFields?.has('street_name') &&
    changes.street_name !== originalStop?.street_name

  return (
    <div
      className={cn(
        'p-3 rounded-lg border border-border',
        type === 'delete' && 'bg-destructive/10 border-destructive/20',
        type === 'new' && 'bg-primary/10 border-primary/20',
        type === 'edit' && 'bg-accent',
      )}
    >
      <div className="flex items-center gap-2">
        {(stopCode ?? originalStop?.stop_code) && (
          <Badge
            variant={type === 'delete' ? 'destructive' : 'default'}
            className="shrink-0"
          >
            {hasCodeChange ? (
              <>
                <span className="line-through opacity-50">
                  {originalStop?.stop_code}
                </span>
                {' → '}
                {stopCode}
              </>
            ) : (
              stopCode ?? originalStop?.stop_code
            )}
          </Badge>
        )}
        <div className="flex flex-col">
          <p className="font-medium text-sm">
            {hasNameChange ? (
              <>
                <span className="line-through opacity-50">
                  {originalStop?.stop_name}
                </span>
                {' → '}
                {stopName}
              </>
            ) : (
              stopName ?? originalStop?.stop_name ?? 'Unnamed Stop'
            )}
          </p>
          {(streetName ?? originalStop?.street_name) && (
            <p className="text-xs text-muted-foreground">
              {hasStreetChange ? (
                <>
                  <span className="line-through opacity-50">
                    {originalStop?.street_name}
                  </span>
                  {' → '}
                  {streetName}
                </>
              ) : (
                streetName ?? originalStop?.street_name
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function EditOverlay({ stops }: { stops: Stop[] }) {
  const {
    newStops,
    editedStops,
    deletedStops,
    isSubmitting,
    handleSubmitChanges,
  } = useStopEditor()

  const hasChanges =
    newStops.length > 0 || editedStops.size > 0 || deletedStops.size > 0

  // Create a map of stop IDs to stops for quick lookup
  const stopsMap = new Map(stops.map((stop) => [stop.stop_id, stop]))

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="shadow-lg gap-2"
          disabled={!hasChanges || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Review Changes
          {hasChanges && (
            <Badge variant="secondary">
              {newStops.length + editedStops.size + deletedStops.size}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Review Changes</SheetTitle>
          <SheetDescription>
            Review and submit your changes to the stops
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-12rem)] mt-4 -mx-6 px-6">
          <div className="space-y-6">
            <StopChangesList title="New Stops" count={newStops.length}>
              {newStops.map((stop) => (
                <StopChangesItem
                  key={stop.stop_id}
                  stopCode={stop.stop_code}
                  stopName={stop.stop_name}
                  streetName={stop.street_name}
                  type="new"
                />
              ))}
            </StopChangesList>

            <StopChangesList title="Edited Stops" count={editedStops.size}>
              {Array.from(editedStops.entries()).map(([stopId, changes]) => {
                const {
                  stop_code,
                  stop_name,
                  street_name,
                  changedFields,
                } = changes
                return (
                  <StopChangesItem
                    key={stopId}
                    stopCode={stop_code}
                    stopName={stop_name}
                    streetName={street_name}
                    type="edit"
                    changes={{ stop_code, stop_name, street_name }}
                    originalStop={stopsMap.get(stopId)}
                    changedFields={changedFields}
                  />
                )
              })}
            </StopChangesList>

            <StopChangesList title="Deleted Stops" count={deletedStops.size}>
              {Array.from(deletedStops).map((stopId) => (
                <StopChangesItem
                  key={stopId}
                  type="delete"
                  originalStop={stopsMap.get(stopId)}
                />
              ))}
            </StopChangesList>
          </div>
        </ScrollArea>

        <div className="mt-4">
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleSubmitChanges}
            disabled={!hasChanges || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save All Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
