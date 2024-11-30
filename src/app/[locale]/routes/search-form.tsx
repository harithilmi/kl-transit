'use client'

import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useTransition } from 'react'

export function SearchForm({ initialSearch }: { initialSearch: string }) {
  const t = useTranslations('RoutesPage')
  const router = useRouter()
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        placeholder={t('searchPlaceholder')}
        defaultValue={initialSearch}
        onChange={(e) => {
          startTransition(() => {
            router.push(
              `/${locale}/routes?q=${encodeURIComponent(e.target.value)}`,
            )
          })
        }}
        className={`w-full rounded-lg bg-secondary px-4 py-3 text-secondary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
          isPending ? 'opacity-50' : ''
        }`}
      />
      <button
        onClick={() => {
          const input = document.querySelector('input')!
          startTransition(() => {
            router.push(
              `/${locale}/routes?q=${encodeURIComponent(input.value)}`,
            )
          })
        }}
        disabled={isPending}
        className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        {t('search')}
      </button>
    </div>
  )
}
