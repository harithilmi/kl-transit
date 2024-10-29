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
    <input
      type="text"
      placeholder="Search by route number or destination..."
      defaultValue={initialSearch}
      onChange={(e) => handleSearch(e.target.value)}
      className={`w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 ${
        isPending ? 'opacity-50' : ''
      }`}
    />
  )
}
