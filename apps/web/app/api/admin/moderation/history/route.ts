import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/admin/moderation/history - Get moderation history
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    const target_user_id = searchParams.get('target_user_id')
    const action_type = searchParams.get('action_type')
    const admin_user_id = searchParams.get('admin_user_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('admin_moderation_audit')
      .select('*', { count: 'exact' })

    // Apply filters
    if (target_user_id) {
      query = query.eq('target_user_id', target_user_id)
    }
    if (action_type) {
      query = query.eq('action_type', action_type)
    }
    if (admin_user_id) {
      query = query.eq('admin_user_id', admin_user_id)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: actions, error, count } = await query

    if (error) {
      console.error('Error fetching moderation history:', error)
      return NextResponse.json({ error: 'Failed to fetch moderation history' }, { status: 500 })
    }

    return NextResponse.json({
      actions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Moderation history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}