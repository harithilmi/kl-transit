import { Fragment } from 'react'
import type { RouteStopWithData } from '../types/routes'

interface RouteStopListProps {
  services: RouteStopWithData[]
}

// Helper function to group stops by zone
function groupByZone(stops: RouteStopWithData[]) {
  return stops.reduce<Record<string, RouteStopWithData[]>>((acc, stop) => {
    const zone = stop.zone
    if (!acc[zone]) {
      acc[zone] = []
    }
    acc[zone].push(stop)
    return acc
  }, {})
}

export function RouteStopList({ services }: RouteStopListProps) {
  // Group by direction
  const stopsByDirection = services.reduce((acc, service) => {
    const direction = service.direction
    if (!acc[direction]) {
      acc[direction] = []
    }
    acc[direction].push(service)
    return acc
  }, {} as Record<string, RouteStopWithData[]>)

  const directions = Object.keys(stopsByDirection)
  const firstDirection = directions[0]
  const secondDirection = directions[1]

  // Get stops for each direction with proper type checking
  const firstDirectionStops: RouteStopWithData[] = firstDirection
    ? stopsByDirection[firstDirection] ?? []
    : []
  const secondDirectionStops: RouteStopWithData[] = secondDirection
    ? stopsByDirection[secondDirection] ?? []
    : []

  // Group stops by zone with proper type checking
  const firstDirectionByZone = groupByZone(firstDirectionStops)
  const secondDirectionByZone = groupByZone(
    secondDirectionStops.length > 0 ? [...secondDirectionStops].reverse() : [],
  )

  // Get all stops from first direction
  const allFirstDirectionStops = Object.values(firstDirectionByZone).flat()

  // Only log if the final stops are different
  //   if (firstFinalStop?.stop_id !== secondFinalStop?.stop_id) {
  //     console.log('First Direction Final Stop:', {
  //       name: firstFinalStop?.stop_name,
  //       code: firstFinalStop?.stop_code,
  //       id: firstFinalStop?.stop_id,
  //     })

  //     console.log('Second Direction Final Stop:', {
  //       name: secondFinalStop?.stop_name,
  //       code: secondFinalStop?.stop_code,
  //       id: secondFinalStop?.stop_id,
  //     })
  //   }

  // Get start and end stops
  const startStop = allFirstDirectionStops[0]?.stop?.stop_name ?? ''
  const endStop =
    allFirstDirectionStops.length > 0
      ? allFirstDirectionStops[allFirstDirectionStops.length - 1]?.stop
          ?.stop_name ?? ''
      : ''

  // Get unique zones from first direction
  const uniqueZones = new Set(firstDirectionStops.map((stop) => stop.zone))
  const hasMultipleZones = uniqueZones.size > 1

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-4 bg-white/5 p-4 rounded-t-lg">
        <h1 className="text-4xl font-bold">
          Route {firstDirectionStops[0]?.route_number}
        </h1>
        <span className="text-xl text-white/70">
          {startStop} ↔ {endStop}
        </span>
      </div>

      <div className="flex flex-col">
        {Object.entries(firstDirectionByZone).map(([zone, stops]) => (
          <Fragment key={zone}>
            {/* Zone Header*/}
            {hasMultipleZones && (
              <div className="bg-white/5 p-2 text-center text-sm font-medium text-white/70">
                Zone {zone}
              </div>
            )}

            {/* Stops for this zone */}
            {stops.map((routeStop, index) => {
              const secondDirectionStop = secondDirectionByZone[zone]?.[index]
              const isFirstOrLast = index === 0 || index === stops.length - 1
              const isSameStop =
                isFirstOrLast &&
                routeStop.stop?.stop_id === secondDirectionStop?.stop?.stop_id

              return (
                <div key={`${routeStop.stop_id}-${index}`} className="group">
                  {isSameStop ? (
                    // Combined stop that spans both directions
                    <div className="flex justify-center p-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-white/70">
                          {routeStop.stop?.stop_code}
                        </span>
                        <span className="font-semibold">
                          {routeStop.stop?.stop_name}
                        </span>
                        {routeStop.stop?.street_name && (
                          <span className="text-sm text-white/70">
                            {routeStop.stop.street_name}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex">
                      {/* First direction stop */}
                      <div className="flex-[45] p-4 ">
                        <div className="flex flex-col">
                          <span className="text-sm text-right text-white/70 h-5">
                            {routeStop.stop?.stop_code ?? '\u00A0'}
                          </span>
                          <p className="font-semibold text-right">
                            {routeStop.stop?.stop_name}
                          </p>
                          <span className="text-sm text-right text-white/70 h-5">
                            {routeStop.stop?.street_name ?? '\u00A0'}
                          </span>
                        </div>
                      </div>

                      {/* Center divider with arrows */}
                      <div className="flex-[10] flex">
                        <div className="flex-1 relative">
                          <div className="relative h-full">
                            <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-indigo-600" />
                            <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2">
                              <svg
                                viewBox="0 0 24 24"
                                className="h-full w-full text-white"
                              >
                                <path
                                  fill="currentColor"
                                  d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 relative">
                          <div className="relative h-full">
                            <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-indigo-600" />
                            <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2">
                              <svg
                                viewBox="0 0 24 24"
                                className="h-full w-full rotate-180 text-white"
                              >
                                <path
                                  fill="currentColor"
                                  d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Second direction stop */}
                      <div className="flex-[45] p-4">
                        {secondDirectionStop && (
                          <div className="flex flex-col">
                            <span className="text-sm text-white/70 h-5">
                              {secondDirectionStop.stop?.stop_code ?? '\u00A0'}
                            </span>
                            <span className="font-semibold">
                              {secondDirectionStop.stop?.stop_name}
                            </span>
                            {secondDirectionStop.stop?.street_name && (
                              <span className="text-sm text-white/70">
                                {secondDirectionStop.stop.street_name}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
