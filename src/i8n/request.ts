import { getRequestConfig } from 'next-intl/server'
import { routing } from '@/i8n/routing'

export type Locale = typeof routing.locales[number]
export type Messages = Record<string, string>
export type MessagesModule = { default: Messages }

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as Locale

  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale
  }

  const messages = (await import(
    `../../messages/${locale}.json`
  )) as MessagesModule

  return {
    locale,
    messages: messages.default,
  }
})
