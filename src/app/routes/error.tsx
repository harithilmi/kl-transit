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
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <Card className="flex max-w-xl flex-col gap-4 p-6 text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-white/80">
          We encountered an error while loading the routes. Please try again.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-white px-4 py-2 font-semibold text-[#2e026d] hover:bg-white/90"
        >
          Try again
        </button>
      </Card>
    </main>
  )
}
