'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export function SearchForm({ initialSearch }: { initialSearch: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }

    startTransition(() => {
      router.replace(`/routes?${params.toString()}`)
    })
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Search for a bus route or destination..."
        defaultValue={initialSearch}
        onChange={(e) => {
          startTransition(() => {
            router.push(`/routes?q=${encodeURIComponent(e.target.value)}`)
          })
        }}
        className={`w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 ${
          isPending ? 'opacity-50' : ''
        }`}
      />
      <button
        onClick={() => {
          const input = document.querySelector('input') as HTMLInputElement
          startTransition(() => {
            router.push(`/routes?q=${encodeURIComponent(input.value)}`)
          })
        }}
        disabled={isPending}
        className="rounded-lg bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
      >
        Search
      </button>
    </div>
  )
}
