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

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSearch(searchTerm)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search for a bus route"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyPress}
          className={`w-full rounded-lg bg-secondary px-4 py-3 text-secondary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
            isPending ? 'opacity-50' : ''
          }`}
        />
        <button
          onClick={() => handleSearch(searchTerm)}
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          Search
        </button>
      </div>
    </div>
  )
}
