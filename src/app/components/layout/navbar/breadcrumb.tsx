'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { PresetLinkKey, CustomLink, LinkItem } from '@/types/nav'

interface NavBreadcrumbProps {
  items: LinkItem[]
  renderCustomItem?: (item: CustomLink) => React.ReactNode
}

export function NavBreadcrumb({ items, renderCustomItem }: NavBreadcrumbProps) {
  const t = useTranslations()

  const renderItem = (item: LinkItem, index: number) => {
    if (typeof item === 'string') {
      return (
        <Link
          href={`/${item}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t(`nav.${item}`)}
        </Link>
      )
    }

    // Check if there's a custom renderer for this item
    if (renderCustomItem) {
      const customRendered = renderCustomItem(item)
      if (customRendered) return customRendered
    }

    return (
      <Link
        href={item.href}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {item.translateLabel ? t(item.label) : item.label}
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {items.map((item, index) => (
        <div
          key={typeof item === 'string' ? item : item.href}
          className="flex items-center gap-2"
        >
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}
