import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i8n/routing'

const handleI18nRouting = createMiddleware(routing)

const isProtectedRoute = createRouteMatcher(['/:locale/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()

  if (
    req.nextUrl.pathname === '/sitemap.xml' ||
    req.nextUrl.pathname === '/robots.txt'
  ) {
    return
  }

  if (req.nextUrl.pathname.startsWith('/api')) {
    return
  }

  return handleI18nRouting(req)
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
