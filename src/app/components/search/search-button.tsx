'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'secondary'
}

export function SearchButton({
  className,
  variant = 'outline',
}: SearchButtonProps) {
  const t = useTranslations('Common')

  return (
    <Button
      variant={variant}
      className={cn(
        'w-full justify-start text-base font-normal bg-secondary hover:bg-secondary/80',
        'text-muted-foreground',
        className,
      )}
      onClick={() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <Search className="h-5 w-5" />
        <span>{t('searchPlaceholder')}</span>
      </div>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background/50 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:inline-flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  )
}
