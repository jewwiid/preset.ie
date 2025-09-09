import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET /api/admin/verification/requests - List verification requests
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role_flags')
      .eq('user_id', user.id)
      .single()

    if (!profile?.role_flags?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const verification_type = searchParams.get('verification_type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('admin_verification_dashboard')
      .select('*', { count: 'exact' })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (verification_type) {
      query = query.eq('verification_type', verification_type)
    }

    // Prioritize pending requests
    query = query
      .order('status', { ascending: true }) // pending comes before others alphabetically
      .order('submitted_at', { ascending: true }) // oldest first within each status
      .range(offset, offset + limit - 1)

    const { data: requests, error, count } = await query

    if (error) {
      console.error('Error fetching verification requests:', error)
      return NextResponse.json({ error: 'Failed to fetch verification requests' }, { status: 500 })
    }

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Verification requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}