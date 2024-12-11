import { useState, useEffect } from 'react'
import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import type { Service, SelectedStop } from '@/types/routes'

interface EditMenuProps {
  services: Service[]
  selectedStop: SelectedStop | null
  onAddStop: (stop: SelectedStop) => void
  onReorderStops: (stops: Service[]) => void
  activeDirection: 1 | 2
  setActiveDirection: React.Dispatch<React.SetStateAction<1 | 2>>
  setReorderedStops: (stops: Service[]) => void
  setSelectedStop: (stop: SelectedStop | null) => void
  routeId: string
}

export function EditMenu({
  services,
  selectedStop,
  onAddStop,
  onReorderStops,
  activeDirection,
  setActiveDirection,
  setReorderedStops,
  setSelectedStop,
  routeId,
}: EditMenuProps) {
  const [reorderedServices, setReorderedServices] = useState(services)
  const [hasChanges, setHasChanges] = useState(false)
  const [draggedStop, setDraggedStop] = useState<Service | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isMinimized, setIsMinimized] = useState(true)

  // Reset reordered services when direction changes
  useEffect(() => {
    setReorderedServices(services)
    setHasChanges(false)
  }, [services, activeDirection])

  // Sort services by sequence and split by direction
  const sortedServices = [...reorderedServices].sort(
    (a, b) => a.sequence - b.sequence,
  )
  const currentDirectionServices = sortedServices.filter(
    (s) => s.direction === activeDirection,
  )
  const otherDirectionServices = sortedServices.filter(
    (s) => s.direction !== activeDirection,
  )

  const handleDragStart = (
    e: React.DragEvent,
    service: Service,
    index: number,
  ) => {
    e.stopPropagation()
    setDraggedStop(service)
    // Store the index in the dataTransfer
    e.dataTransfer.setData('text/plain', index.toString())
    // Add a visual effect
    const target = e.target as HTMLElement
    setTimeout(() => {
      target.style.opacity = '0.4'
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation()
    setDraggedStop(null)
    setDragOverIndex(null)
    // Reset opacity
    const target = e.target as HTMLElement
    target.style.opacity = '1'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (draggedStop && dragIndex !== dropIndex) {
      const stopsToReorder = [...currentDirectionServices]
      const removed = stopsToReorder[dragIndex]
      if (!removed) return

      stopsToReorder.splice(dragIndex, 1)
      stopsToReorder.splice(dropIndex, 0, removed)

      // Update sequences
      const updatedStops = stopsToReorder.map((stop, index) => ({
        ...stop,
        sequence: index + 1,
      }))

      // Combine with other direction's stops
      const newServices = [...updatedStops, ...otherDirectionServices]
      setReorderedServices(newServices)
      setReorderedStops(newServices)
      setHasChanges(true)
    }

    setDraggedStop(null)
    setDragOverIndex(null)
  }

  const handleSaveChanges = () => {
    onReorderStops(
      reorderedServices.map((service) => ({
        ...service,
        direction: service.direction as 1 | 2,
      })),
    )
    setHasChanges(false)
  }

  const handleStopClick = (service: typeof services[0] | undefined) => {
    if (!service) return
    fetch(`/api/services?stopId=${service.stop_id}`)
      .then((res) => res.json())
      .then((data: { route_number: string }[]) => {
        const routes = data.map((s) => s.route_number)
        const uniqueRoutes = Array.from(new Set(routes))

        const stopData: SelectedStop = {
          name: service.stop.stop_name,
          code: service.stop.stop_code,
          coordinates: [
            parseFloat(service.stop.latitude),
            parseFloat(service.stop.longitude),
          ],
          street_name: service.stop.street_name ?? undefined,
          routes: uniqueRoutes,
        }
        setSelectedStop(stopData)
      })
      .catch((error) => {
        console.error('Error fetching stop services:', error)
      })
  }

  return (
    <Card
      className={`absolute p-4 bg-background/95 backdrop-blur z-[1000] 
		w-[calc(100%-2rem)] sm:w-[400px] transition-all duration-300 ease-in-out
		${
      isMinimized
        ? 'bottom-4 right-4 h-[56px]'
        : 'top-4 right-4 max-h-[calc(100dvh-2rem)]'
    } 
		flex flex-col overflow-hidden`}
    >
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="font-semibold">Editing Route {routeId}</h3>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              onClick={handleSaveChanges}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Save Changes
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0"
          >
            {isMinimized ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
          </Button>
        </div>
      </div>

      <div
        className={`flex flex-col transition-all duration-300 ease-in-out overflow-hidden
		  ${isMinimized ? 'h-0' : 'h-full'}`}
      >
        {selectedStop && (
          <Button
            onClick={() => onAddStop(selectedStop)}
            className="w-full mb-4"
          >
            Add Selected Stop
          </Button>
        )}

        <div className="flex gap-2 mb-4">
          <Button
            variant={activeDirection === 1 ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setActiveDirection(1)}
          >
            Direction 1
          </Button>
          <Button
            variant={activeDirection === 2 ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setActiveDirection(2)}
          >
            Direction 2
          </Button>
        </div>

        <div className="overflow-y-auto min-h-0 flex-1">
          <div className="space-y-2">
            {currentDirectionServices.map((service, index) => (
              <div
                key={service.id}
                draggable
                onDragStart={(e) => handleDragStart(e, service, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`bg-muted p-2 rounded-md group hover:bg-muted/70 transition-colors cursor-move
					${draggedStop?.id === service.id ? 'opacity-40' : ''}
					${dragOverIndex === index ? 'border-t-2 border-primary' : ''}`}
                onClick={() => handleStopClick(service)}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs shrink-0 w-4">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {service.stop.stop_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {service.stop.stop_code}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
