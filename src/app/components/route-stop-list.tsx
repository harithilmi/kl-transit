import { Fragment } from 'react'

type Stop = {
  stop_id: string
  stop_code: string
  stop_name: string
  street_name: string
  latitude: string
  longitude: string
  stop_name_old: string
  street_name_old: string
}

type RouteStop = {
  route_number: string
  stop_id: string
  stop_code: string
  direction: string
  zone: string
  sequence: string
}

type RouteStopWithData = RouteStop & {
  stop: Stop | undefined
}

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
              return (
                <tr key={`${routeStop.stop_id}-${index}`} className="group">
                  {/* First direction stop */}
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
                        <div className="after:content-[''] after:absolute after:bottom-0 after:left-[50%] after:h-[8px] after:w-[8px] after:-translate-y-4 after:rotate-[45deg] after:border-b-2 after:border-r-2 after:border-[#ffffff] after:opacity-50" />
                      </div>
                    )}
                  </td>

                  {/* Second direction stop */}
                  <td className="w-[5%] border-l border-white/10 p-0">
                    {secondDirectionStop && index < stops.length - 1 && (
                      <div className="relative h-full w-full">
                        <div className="absolute left-1/2 top-0 h-full w-px bg-white/20" />
                        <div className="after:content-[''] after:absolute after:bottom-0 after:left-[50%] after:h-[8px] after:w-[8px] after:-translate-y-4 after:rotate-[225deg] after:border-b-2 after:border-r-2 after:border-[#ffffff] after:opacity-50" />
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
                </tr>
              )
            })}
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}
