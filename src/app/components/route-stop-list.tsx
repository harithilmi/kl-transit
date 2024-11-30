'use client'

import type { Service } from '../../types/routes'

interface RouteStopListProps {
  services: Service[]
}

export function RouteStopList({ services = [] }: RouteStopListProps) {
  // Sort services by sequence
  const sortedServices = [...services].sort((a, b) => a.sequence - b.sequence)

  // Get services for each direction
  const direction1Services = sortedServices.filter((s) => s.direction === 1)
  const direction2Services = sortedServices.filter((s) => s.direction === 2)

  // Get first and last stops for each direction
  const direction1First = direction1Services[0]
  const direction1Last = direction1Services[direction1Services.length - 1]
  const direction2First = direction2Services[0]
  const direction2Last = direction2Services[direction2Services.length - 1]

  // Check if any terminal stop is shared
  const isSharedFirstStop = direction1First?.stop_id === direction2Last?.stop_id
  const isSharedLastStop = direction1Last?.stop_id === direction2First?.stop_id

  return (
    <div className="flex p-4 h-full">
      <div className="flex w-full flex-col">
        {/* Show first terminal stop if shared */}
        {isSharedFirstStop && (
          <div className="flex flex-col py-4 hover:bg-accent/50 rounded-lg transition-colors duration-300">
            <h3 className="text-lg text-muted-foreground text-center">
              {direction1First?.stop.stop_code}
            </h3>
            <h2 className="text-lg font-medium text-center">
              {direction1First?.stop.stop_name}
            </h2>
            <h3 className="text-lg text-muted-foreground text-center">
              {direction1First?.stop.street_name}
            </h3>
          </div>
        )}

        {/* Start Half Circle */}
        <div className="relative top-0 left-1/2 w-[1.375rem] h-8 -translate-x-1/2 rounded-t-full border-t-[0.2rem] border-l-[0.2rem] border-r-[0.2rem] border-primary"></div>

        <div className="flex w-full justify-between">
          {/* First direction */}
          <div className="flex-1 flex flex-col h-full justify-between">
            {direction1Services.map(
              (service) =>
                (!isSharedFirstStop ||
                  service.stop_id !== direction1First?.stop_id) &&
                (!isSharedLastStop ||
                  service.stop_id !== direction1Last?.stop_id) && (
                  <div
                    key={`${service.id}-${service.stop_id}-${service.sequence}`}
                    className="hover:bg-accent/50 rounded-lg transition-colors duration-300 pr-5 py-4 relative after:absolute after:top-0 after:right-0 after:w-[0.2rem] after:h-full after:bg-primary after:translate-x-[-0.5rem] grow min-h-0 before:absolute before:top-1/2 before:right-0 before:w-2 before:h-2 before:border-t-2 before:border-r-2 before:border-foreground before:z-10 before:translate-x-[-0.35rem] before:-translate-y-1/2 before:rotate-[135deg] flex flex-col justify-center"
                  >
                    <h3 className="text-sm text-muted-foreground text-right">
                      {service.stop.stop_code}
                    </h3>
                    <h2 className="text-sm font-medium text-right">
                      {service.stop.stop_name}
                    </h2>
                    <h3 className="text-sm text-muted-foreground text-right">
                      {service.stop.street_name}
                    </h3>
                  </div>
                ),
            )}
          </div>
          {/* Second direction */}
          <div className="flex-1 flex flex-col h-full justify-between">
            {[...direction2Services].reverse().map(
              (service) =>
                (!isSharedFirstStop ||
                  service.stop_id !== direction2Last?.stop_id) &&
                (!isSharedLastStop ||
                  service.stop_id !== direction2First?.stop_id) && (
                  <div
                    key={`${service.id}-${service.stop_id}-${service.sequence}`}
                    className="hover:bg-accent/50 rounded-lg transition-colors duration-300 pl-5 py-4 relative after:absolute after:top-0 after:left-0 after:w-[0.2rem] after:h-full after:bg-primary after:translate-x-[0.5rem] grow before:absolute before:top-1/2 before:left-0 before:w-2 before:h-2 before:border-t-2 before:border-r-2 before:border-foreground before:z-10 before:translate-x-[0.35rem] before:rotate-[-45deg] flex flex-col justify-center"
                  >
                    <h3 className="text-sm text-muted-foreground text-left">
                      {service.stop.stop_code}
                    </h3>
                    <h2 className="text-sm font-medium text-left">
                      {service.stop.stop_name}
                    </h2>
                    <h3 className="text-sm text-muted-foreground text-left">
                      {service.stop.street_name}
                    </h3>
                  </div>
                ),
            )}
          </div>
        </div>

        {/* Ending Half Circle */}
        <div className="relative top-0 left-1/2 w-[1.375rem] h-8 -translate-x-1/2 rounded-b-full border-b-[0.2rem] border-l-[0.2rem] border-r-[0.2rem] border-primary"></div>

        {/* Show last terminal stop if shared */}
        {isSharedLastStop && (
          <div className="flex flex-col py-4 hover:bg-accent/50 rounded-lg transition-colors duration-300">
            <h3 className="text-lg text-muted-foreground text-center">
              {direction1Last?.stop.stop_code}
            </h3>
            <h2 className="text-lg font-medium text-center">
              {direction1Last?.stop.stop_name}
            </h2>
            <h3 className="text-lg text-muted-foreground text-center">
              {direction1Last?.stop.street_name}
            </h3>
          </div>
        )}
      </div>
    </div>
  )
}
