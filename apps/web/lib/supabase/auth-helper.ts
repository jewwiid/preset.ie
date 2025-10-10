import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Get the authenticated user from the current request (server-side only)
 *
 * This function validates the JWT token server-side using getUser(),
 * which is the recommended approach according to Supabase best practices.
 *
 * DO NOT use getSession() for server-side authentication as it does not
 * validate the JWT and can be spoofed.
 *
 * Usage in API routes:
 *
 * ```ts
 * import { getAuthenticatedUser } from '@/lib/supabase/auth-helper'
 *
 * export async function GET(request: NextRequest) {
 *   const user = await getAuthenticatedUser()
 *
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *
 *   // Your authenticated logic here
 *   return NextResponse.json({ userId: user.id })
 * }
 * ```
 *
 * @returns The authenticated user or null if not authenticated
 */
export async function getAuthenticatedUser() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll may fail in Server Components - this is expected
          }
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}
