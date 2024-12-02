import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i8n/routing'

const handleI18nRouting = createMiddleware(routing)

const isProtectedRoute = createRouteMatcher(['/:locale/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()

  if (req.nextUrl.pathname.startsWith('/api')) {
    return
  }

  return handleI18nRouting(req)
})

export const config = {
  // Match internationalized pathnames and API routes
  matcher: [
    // Match all API routes
    // '/api/:path*',
    // Match all pages
    // '/',
    // '/(ms|en)/:path*',

    //   from  https://clerk.com/docs/upgrade-guides/core-2/nextjs#migrating-to-clerk-middleware
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
  // Remove excludedRoutes if present
}
