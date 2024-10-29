'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'

export function HomeSearchForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')

  function handleSearch(term: string) {
    if (term) {
      startTransition(() => {
        router.push(`/routes?q=${encodeURIComponent(term)}`)
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search for a bus route or destination..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 ${
            isPending ? 'opacity-50' : ''
          }`}
        />
        <button
          onClick={() => handleSearch(searchTerm)}
          disabled={isPending}
          className="rounded-lg bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
        >
          Search
        </button>
      </div>
    </div>
  )
}
