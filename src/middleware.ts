import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i8n/routing'
import { type NextRequest, NextResponse } from 'next/server'

export default createMiddleware(routing)

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the pathname is missing a locale
  if (!pathname.startsWith('/en') && !pathname.startsWith('/ms')) {
    // Redirect to the default locale (e.g., 'en')
    return NextResponse.redirect(new URL(`/en${pathname}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Match both internationalized and API pathnames
  matcher: [
    '/',
    '/routes',
    '/routes/:routeId',
    '/api/:path*',
    '/(ms|en)/:path*',
  ],
}
