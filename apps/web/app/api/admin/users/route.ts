import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/admin/users - Search/filter users
export async function GET(request: NextRequest) {
  try {
    // First verify admin with route handler client
    const authSupabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authError } = await authSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await authSupabase
      .from('users_profile')
      .select('account_type')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_type?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Now use service role client for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const subscription_tier = searchParams.get('subscription_tier')
    const has_violations = searchParams.get('has_violations')
    const is_banned = searchParams.get('is_banned')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('users_profile')
      .select(`
        *,
        user_violations!user_violations_user_id_fkey(count),
        reports!reports_reported_user_id_fkey(count)
      `, { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,handle.ilike.%${search}%`)
    }

    // Apply role filter
    if (role) {
      query = query.contains('account_type', [role])
    }

    // Apply subscription filter
    if (subscription_tier) {
      query = query.eq('subscription_tier', subscription_tier)
    }

    // Apply banned filter
    if (is_banned === 'true') {
      query = query.contains('account_type', ['BANNED'])
    } else if (is_banned === 'false') {
      query = query.not('account_type', 'cs', '["BANNED"]')
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get violation counts and risk scores for each user
    const usersWithMetrics = await Promise.all(
      (users || []).map(async (user) => {
        // Get violation count
        const { data: violationCount } = await supabase
          .rpc('get_user_violation_count', { p_user_id: user.user_id })

        // Get risk score
        const { data: riskScore } = await supabase
          .rpc('calculate_user_risk_score', { p_user_id: user.user_id })

        // Check suspension/ban status
        const { data: status } = await supabase
          .rpc('is_user_suspended_or_banned', { p_user_id: user.user_id })

        return {
          ...user,
          violation_count: violationCount || 0,
          risk_score: riskScore || 0,
          is_suspended: status?.[0]?.is_suspended || false,
          is_banned: status?.[0]?.is_banned || false,
          suspension_expires_at: status?.[0]?.suspension_expires_at
        }
      })
    )

    return NextResponse.json({
      users: usersWithMetrics,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Users search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}