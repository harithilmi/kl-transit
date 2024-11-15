import type { RouteStopWithData } from '../types/routes'

interface RouteStopListProps {
  services: RouteStopWithData[]
}

export function RouteStopList({ services }: RouteStopListProps) {
  // Sort services by sequence
  const sortedServices = [...services].sort((a, b) => a.sequence - b.sequence)

  return (
    <div className="flex p-4 h-full">
      <div className="flex w-full justify-between">
        <div className="flex-1 flex flex-col h-full justify-between">
          {/* First direction stops, already sorted by sequence */}
          {sortedServices.map(
            (service) =>
              service.direction === 1 && (
                <div
                  className="hover:bg-white/10 px-6 rounded-lg transition-colors duration-300 pr-8 py-4 relative after:absolute after:top-0 after:right-0 after:w-1 after:h-full after:bg-indigo-600 after:translate-x-[-1rem] grow min-h-0"
                  key={service.stop_id}
                >
                  <h3 className=" text-sm text-gray-400 text-right">
                    {service.stop_code}
                  </h3>
                  <h2 className="text-md font-medium text-right">
                    {service.stop?.stop_name}
                  </h2>
                  <h3 className="text-sm text-gray-300 text-right">
                    {service.stop?.street_name}
                  </h3>
                </div>
              ),
          )}
        </div>
        <div className="flex-1 flex flex-col h-full justify-between">
          {/* Second direction stops, already sorted by sequence */}
          {sortedServices.reverse().map(
            (service) =>
              service.direction === 2 && (
                <div
                  className="hover:bg-white/10 px-6 rounded-lg transition-colors duration-300 pl-8 py-4 relative after:absolute after:top-0 after:left-0 after:w-1 after:h-full after:bg-indigo-600 after:translate-x-[1rem] grow"
                  key={service.stop_id}
                >
                  <h3 className=" text-sm text-gray-400 text-left">
                    {service.stop_code}
                  </h3>
                  <h2 className="text-md font-medium text-left">
                    {service.stop?.stop_name}
                  </h2>
                  <h3 className="text-sm text-gray-300 text-left">
                    {service.stop?.street_name}
                  </h3>
                </div>
              ),
          )}
        </div>
      </div>
    </div>
  )
}
