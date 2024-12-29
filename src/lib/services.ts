import type { Service } from '@/types/routes'
import { getServices } from '@/lib/data/access'

export async function filterServices(params: {
  stopId?: number
  routeNumber?: string
  direction?: 1 | 2
}): Promise<Service[]> {
  const services = await getServices()

  return services
    .filter((service) => {
      if (params.stopId && service.stop_id !== params.stopId) return false
      if (params.routeNumber && service.route_number !== params.routeNumber)
        return false
      if (params.direction && service.direction !== params.direction)
        return false
      return true
    })
    .sort((a, b) => a.sequence - b.sequence)
}
