'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface NavbarSearchButtonProps {
  className?: string
}

export function NavbarSearchButton({ className }: NavbarSearchButtonProps) {
  const t = useTranslations('Common')
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(navigator.userAgent.toLowerCase().includes('mac'))
    }
  }, [])

  return (
    <Button
      variant="outline"
      className={cn('w-[180px] gap-2 justify-between', className)}
      onClick={() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      }}
    >
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4" />
        <span>{t('search')}</span>
      </div>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:inline-flex">
        <span className="text-xs">{isMac ? '⌘' : 'Ctrl'}</span>K
      </kbd>
    </Button>
  )
}
