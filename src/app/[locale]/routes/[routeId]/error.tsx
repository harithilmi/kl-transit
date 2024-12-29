'use client'

import { useEffect } from 'react'
import { Button } from '@/app/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (error) {
      console.error('Error:', error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Something went wrong!</h2>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
