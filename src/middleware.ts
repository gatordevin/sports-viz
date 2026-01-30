import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define protected routes (require authentication)
const isProtectedRoute = createRouteMatcher([
  '/odds(.*)',
  '/api/checkout(.*)',
  '/api/subscription(.*)',
])

// Define public routes (no auth required)
const isPublicRoute = createRouteMatcher([
  '/',
  '/nba(.*)',
  '/nfl(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/pricing(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
