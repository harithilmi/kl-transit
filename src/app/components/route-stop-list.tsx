import { Fragment } from 'react'
import type { RouteStopWithData } from '../types/routes'

interface RouteStopListProps {
  stopsByDirection: Record<string, RouteStopWithData[]>
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

export function RouteStopList({ stopsByDirection }: RouteStopListProps) {
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
  // Get all stops from second direction
  const allSecondDirectionStops = Object.values(secondDirectionByZone).flat()

  const firstFinalStop =
    allFirstDirectionStops[allFirstDirectionStops.length - 1]?.stop
  const secondFinalStop =
    allSecondDirectionStops[allSecondDirectionStops.length - 1]?.stop

  // Only log if the final stops are different
  if (firstFinalStop?.stop_id !== secondFinalStop?.stop_id) {
    console.log('First Direction Final Stop:', {
      name: firstFinalStop?.stop_name,
      code: firstFinalStop?.stop_code,
      id: firstFinalStop?.stop_id,
    })

    console.log('Second Direction Final Stop:', {
      name: secondFinalStop?.stop_name,
      code: secondFinalStop?.stop_code,
      id: secondFinalStop?.stop_id,
    })
  }

  // Get start and end stops
  const startStop = allFirstDirectionStops[0]?.stop?.stop_name ?? ''
  const endStop =
    allFirstDirectionStops.length > 0
      ? allFirstDirectionStops[allFirstDirectionStops.length - 1]?.stop
          ?.stop_name ?? ''
      : ''

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-4 bg-white/5 p-4 rounded-lg">
        <h1 className="text-4xl font-bold">
          Route {firstDirectionStops[0]?.route_number}
        </h1>
        <span className="text-xl text-white/70">
          {startStop} ↔ {endStop}
        </span>
      </div>
      <table className="w-full">
        <tbody>
          {Object.entries(firstDirectionByZone).map(([zone, stops]) => (
            <Fragment key={zone}>
              {/* Zone Header */}
              <tr>
                <td
                  className="bg-white/5 p-2 text-center text-sm font-medium text-white/70"
                  colSpan={4}
                >
                  Zone {zone}
                </td>
              </tr>

              {/* Stops for this zone */}
              {stops.map((routeStop, index) => {
                const secondDirectionStop = secondDirectionByZone[zone]?.[index]
                const isFirstOrLast = index === 0 || index === stops.length - 1
                const isSameStop =
                  isFirstOrLast &&
                  routeStop.stop?.stop_id === secondDirectionStop?.stop?.stop_id

                return (
                  <tr key={`${routeStop.stop_id}-${index}`} className="group">
                    {isSameStop ? (
                      // Combined stop that spans both directions
                      <td className="p-4 text-center" colSpan={4}>
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
                      </td>
                    ) : (
                      <>
                        {/* First direction stop */}
                        <td className="w-[45%] p-4 text-right">
                          <div className="flex flex-col items-end">
                            {routeStop.stop?.stop_code && (
                              <span className="text-sm text-white/70">
                                {routeStop.stop?.stop_code}
                              </span>
                            )}
                            <span className="font-semibold">
                              {routeStop.stop?.stop_name}
                            </span>
                            {routeStop.stop?.street_name && (
                              <span className="text-sm text-white/70">
                                {routeStop.stop.street_name}
                              </span>
                            )}
                            {routeStop.zone && (
                              <span className="text-sm text-white/70">
                                Zone {routeStop.zone}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Separator */}
                        <td className="w-[5%] p-0">
                          {index < stops.length - 1 && (
                            <div className="relative h-full w-full">
                              <div className="absolute left-1/2 top-0 h-full w-px bg-white/20" />
                              <div className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-4">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-full w-full text-white/50"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </td>
                        {/* Separator */}
                        <td className="w-[5%] border-l border-white/10 p-0">
                          {secondDirectionStop && index < stops.length - 1 && (
                            <div className="relative h-full w-full">
                              <div className="absolute left-1/2 top-0 h-full w-px bg-white/20" />
                              <div className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-4">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-full w-full rotate-180 text-white/50"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </td>
                        {/* Second direction stop */}
                        <td className="w-[45%] p-4">
                          {secondDirectionStop && (
                            <div className="flex flex-col">
                              {secondDirectionStop.stop?.stop_code && (
                                <span className="text-sm text-white/70">
                                  {secondDirectionStop.stop?.stop_code}
                                </span>
                              )}
                              <span className="font-semibold">
                                {secondDirectionStop.stop?.stop_name}
                              </span>
                              {secondDirectionStop.stop?.street_name && (
                                <span className="text-sm text-white/70">
                                  {secondDirectionStop.stop.street_name}
                                </span>
                              )}
                              {secondDirectionStop.zone && (
                                <span className="text-sm text-white/70">
                                  Zone {secondDirectionStop.zone}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
