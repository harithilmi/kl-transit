'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/app/components/ui/command'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface RouteSuggestion {
  route_number: string
  route_name: string
}

export function HomeSearchForm() {
  const t = useTranslations('HomePage')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<RouteSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  async function fetchSuggestions(term: string) {
    if (!term) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/routes?q=${encodeURIComponent(term)}`)
      const data = (await res.json()) as RouteSuggestion[]
      setSuggestions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearch(term: string) {
    if (term) {
      startTransition(() => {
        router.push(`/routes/${term}`)
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onValueChange={(value) => {
            setSearchTerm(value)
            void fetchSuggestions(value)
          }}
          className={cn('border-0 focus:ring-0', isPending && 'opacity-50')}
        />
        <CommandList>
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {!isLoading && searchTerm && (
            <>
              <CommandEmpty>{t('noResults')}</CommandEmpty>
              <CommandGroup>
                {suggestions.map((route) => (
                  <CommandItem
                    key={route.route_number}
                    value={route.route_number}
                    onSelect={(value) => {
                      setSearchTerm(value)
                      handleSearch(value)
                    }}
                  >
                    <span className="font-medium">{route.route_number}</span>
                    <span className="ml-2 text-muted-foreground">
                      {route.route_name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
      <button
        onClick={() => handleSearch(searchTerm)}
        disabled={isPending}
        className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        {t('search')}
      </button>
    </div>
  )
}
