'use client'

import { useEffect } from 'react'
import { Card } from '~/components/ui/card'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-16 text-foreground">
      <div className="container flex max-w-6xl flex-col items-center gap-12">
        <Card className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
          <p className="text-muted-foreground mb-6">
            {error.message ||
              'There was an error loading the route information.'}
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        </Card>
      </div>
    </main>
  )
}
