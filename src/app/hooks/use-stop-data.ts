import { useState, useEffect } from 'react'
import type { Stop } from '@/types/routes'

interface UseStopsResult {
  data: Stop[] | null
  error: Error | null
  isLoading: boolean
}

interface StopsResponse {
  success: boolean
  data: Stop[]
  error?: string
}

export function useStops(): UseStopsResult {
  const [data, setData] = useState<Stop[] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchStops() {
      try {
        const response = await fetch('/api/stops')
        if (!response.ok) {
          throw new Error('Failed to fetch stops')
        }

        const {
          success,
          data: stopsData,
          error: apiError,
        } = (await response.json()) as StopsResponse

        if (!isMounted) return

        if (!success || !stopsData) {
          throw new Error(apiError ?? 'Failed to fetch stops')
        }

        setData(stopsData)
        setError(null)
      } catch (err) {
        if (!isMounted) return
        console.error('Error fetching stops:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setData(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchStops()

    return () => {
      isMounted = false
    }
  }, [])

  return { data, error, isLoading }
}
