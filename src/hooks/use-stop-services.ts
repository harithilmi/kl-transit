import type { Service } from '@/types/routes'
import { useQuery } from '@tanstack/react-query'

interface ServiceResponse {
  success: boolean
  data: Service[]
}

export function useStopServices(stopId: number, enabled: boolean) {
  return useQuery<Service[], Error>({
    queryKey: ['stop-services', stopId],
    queryFn: async () => {
      const res = await fetch(`/api/services?stopId=${stopId}`)
      if (!res.ok) throw new Error('Failed to fetch services')
      const data = (await res.json()) as ServiceResponse
      return data.success ? data.data : []
    },
    enabled,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
