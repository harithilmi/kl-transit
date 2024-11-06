import { Fragment } from 'react'
import type { RouteStopWithData } from '../types/routes'

interface RouteStopListProps {
  firstDirectionByZone: Record<string, RouteStopWithData[]>
  secondDirectionByZone: Record<string, RouteStopWithData[]>
}

export function RouteStopList({
  firstDirectionByZone,
  secondDirectionByZone,
}: RouteStopListProps) {
  return (
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
                      <td className="w-[45%] p-4 text-right">
                        <div className="flex flex-col items-end">
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
                      <td className="w-[45%] p-4">
                        {secondDirectionStop && (
                          <div className="flex flex-col">
                            <span className="text-sm text-white/70">
                              {secondDirectionStop.stop?.stop_code}
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
  )
}
