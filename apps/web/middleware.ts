import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip middleware entirely for API routes to avoid body consumption issues
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Validate and refresh user session - this validates the JWT server-side
  // and automatically refreshes the token if needed
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Middleware: Error validating user:', error.message)
  }

  if (user) {
    console.log('Middleware: User authenticated, token refreshed if needed')
  } else {
    console.log('Middleware: No authenticated user found')
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    // Dashboard & Profile
    '/dashboard',
    '/profile/settings',

    // Admin
    '/admin',

    // Gigs
    '/gigs/create',
    '/gigs/my-gigs',
    '/gigs/saved',
    '/applications',

    // Playground & Creative Tools
    '/playground',
    '/treatments/create',

    // Collaboration
    '/collaborate/create',

    // Presets & Marketplace
    '/presets/create',
    '/presets/marketplace/my-listings',
    '/presets/marketplace/purchases',
    '/presets/marketplace/analytics',
    '/marketplace/my-listings',
    '/marketplace/purchases',
    '/marketplace/analytics',

    // Gear (Equipment Rental)
    '/gear/create',
    '/gear/my-listings',
    '/gear/my-requests',
    '/gear/offers',
    '/gear/orders',
    '/gear/reviews',
    '/gear/requests',

    // Communication
    '/messages',

    // Settings & Account
    '/settings',
    '/credits/purchase',
    '/subscription'
  ]

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (completely excluded to avoid body consumption issues)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
