'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function HomeSearchForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSearch(term: string) {
    if (term) {
      startTransition(() => {
        router.push(`/routes?q=${encodeURIComponent(term)}`)
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Search for a bus route or destination..."
        onChange={(e) => handleSearch(e.target.value)}
        className={`w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 ${
          isPending ? 'opacity-50' : ''
        }`}
      />
    </div>
  )
}
