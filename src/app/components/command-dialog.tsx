'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/app/components/ui/command'
import { DialogTitle } from '@/app/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'

interface RouteSuggestion {
  route_number: string
  route_name: string
}

export function CommandMenu() {
  const router = useRouter()
  const t = useTranslations('Common')
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<RouteSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

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
      router.push(`/routes/${term}`)
      setOpen(false)
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <VisuallyHidden.Root>
        <DialogTitle>{t('searchDialog')}</DialogTitle>
      </VisuallyHidden.Root>
      <CommandInput
        placeholder={t('searchPlaceholder')}
        value={searchTerm}
        onValueChange={(value) => {
          setSearchTerm(value)
          void fetchSuggestions(value)
        }}
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
            <CommandGroup heading={t('searchResults')}>
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
    </CommandDialog>
  )
}
