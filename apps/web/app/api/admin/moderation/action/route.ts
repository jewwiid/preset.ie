import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// POST /api/admin/moderation/action - Execute moderation action
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      target_user_id,
      target_content_id,
      action_type,
      reason,
      duration_hours,
      report_id
    } = body

    // Validate required fields
    if (!action_type || !reason || (!target_user_id && !target_content_id)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate expiration for temporary actions
    let expires_at = null
    if (action_type === 'suspend' && duration_hours) {
      expires_at = new Date(Date.now() + duration_hours * 60 * 60 * 1000).toISOString()
    }

    // Create moderation action
    const { data: action, error } = await supabase
      .from('moderation_actions')
      .insert({
        admin_user_id: user.id,
        target_user_id,
        target_content_id,
        action_type,
        reason,
        duration_hours,
        expires_at,
        report_id,
        metadata: {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating moderation action:', error)
      return NextResponse.json({ error: 'Failed to create moderation action' }, { status: 500 })
    }

    // Update user flags if needed
    if (target_user_id) {
      if (action_type === 'ban') {
        await supabase
          .from('users_profile')
          .update({
            role_flags: supabase.sql`array_append(array_remove(role_flags, 'BANNED'), 'BANNED')`
          })
          .eq('user_id', target_user_id)
      } else if (action_type === 'unban') {
        await supabase
          .from('users_profile')
          .update({
            role_flags: supabase.sql`array_remove(role_flags, 'BANNED')`
          })
          .eq('user_id', target_user_id)
      } else if (action_type === 'shadowban') {
        await supabase
          .from('users_profile')
          .update({
            role_flags: supabase.sql`array_append(array_remove(role_flags, 'SHADOWBANNED'), 'SHADOWBANNED')`
          })
          .eq('user_id', target_user_id)
      } else if (action_type === 'unshadowban') {
        await supabase
          .from('users_profile')
          .update({
            role_flags: supabase.sql`array_remove(role_flags, 'SHADOWBANNED')`
          })
          .eq('user_id', target_user_id)
      }
    }

    return NextResponse.json({ 
      success: true,
      action
    }, { status: 201 })
  } catch (error) {
    console.error('Moderation action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}