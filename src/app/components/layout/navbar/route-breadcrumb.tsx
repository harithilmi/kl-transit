'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronDown, Loader2 } from 'lucide-react'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'

interface RouteSuggestion {
  id: number
  route_number: string
  route_name: string
}

interface RouteBreadcrumbProps {
  routeId: string
}

interface ApiResponse {
  success: boolean
  data?: {
    routeShortName: string
    routeLongName: string
  }
  error?: string
}

export function RouteBreadcrumb({ routeId }: RouteBreadcrumbProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<RouteSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [routeData, setRouteData] = useState<ApiResponse['data'] | null>(null)
  const router = useRouter()
  const t = useTranslations()

  useEffect(() => {
    async function fetchRouteData() {
      try {
        const res = await fetch(`/api/routes/${routeId}`)
        const data = (await res.json()) as ApiResponse
        if (data.success && data.data) {
          setRouteData(data.data)
        }
      } catch (error) {
        console.error('Error fetching route:', error)
      }
    }

    void fetchRouteData()
  }, [routeId])

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

  function handleSelect(value: string) {
    const selectedRoute = suggestions.find(
      (route) => route.route_number === value,
    )
    if (selectedRoute) {
      setSearchTerm(value)
      setOpen(false)
      router.push(`/routes/${selectedRoute.id}`)
    }
  }

  if (!routeData) {
    return (
      <div className="text-sm text-muted-foreground">{t('nav.loading')}...</div>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-auto py-1 px-2 font-normal text-sm text-muted-foreground hover:text-foreground"
      >
        {t('nav.route')} {routeData.routeShortName}
        <ChevronDown className="ml-1 h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <VisuallyHidden.Root>
          <DialogTitle>{t('Common.searchDialog')}</DialogTitle>
        </VisuallyHidden.Root>
        <CommandInput
          placeholder={t('nav.searchRoute')}
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
              <CommandEmpty>{t('nav.noResults')}</CommandEmpty>
              <CommandGroup heading={t('nav.searchResults')}>
                {suggestions.map((route) => (
                  <CommandItem
                    key={route.id}
                    value={route.route_number}
                    onSelect={handleSelect}
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
    </>
  )
}
