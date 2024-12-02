'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import * as React from 'react'

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname?.split('/')[1] ?? 'en'
  const t = useTranslations()

  const handleLocaleChange = async (locale: string) => {
    const days = 30
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    const expires = '; expires=' + date.toUTCString()
    document.cookie = `NEXT_LOCALE=${locale}; path=/;${expires}`

    if (currentLocale === locale) {
      router.push(pathname)
    } else {
      const newPath =
        pathname?.substring((currentLocale?.length || 0) + 1) || ''
      router.push(`/${locale}${newPath}`)
    }
  }

  return (
    <Select onValueChange={handleLocaleChange} defaultValue={currentLocale}>
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          {currentLocale === 'en' ? t('Languages.en') : t('Languages.ms')}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="en">{t('Languages.en')}</SelectItem>
          <SelectItem value="ms">{t('Languages.ms')}</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
