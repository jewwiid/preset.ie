import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/admin/moderation/action - Execute moderation action
export async function POST(request: NextRequest) {
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
      // First get the current user's role_flags
      const { data: userData } = await supabase
        .from('users_profile')
        .select('role_flags')
        .eq('user_id', target_user_id)
        .single()
      
      let updatedFlags = userData?.role_flags || []
      
      if (action_type === 'ban') {
        // Remove BANNED if exists, then add it
        updatedFlags = updatedFlags.filter((flag: string) => flag !== 'BANNED')
        updatedFlags.push('BANNED')
        
        await supabase
          .from('users_profile')
          .update({ role_flags: updatedFlags })
          .eq('user_id', target_user_id)
      } else if (action_type === 'unban') {
        // Remove BANNED flag
        updatedFlags = updatedFlags.filter((flag: string) => flag !== 'BANNED')
        
        await supabase
          .from('users_profile')
          .update({ role_flags: updatedFlags })
          .eq('user_id', target_user_id)
      } else if (action_type === 'shadowban') {
        // Remove SHADOWBANNED if exists, then add it
        updatedFlags = updatedFlags.filter((flag: string) => flag !== 'SHADOWBANNED')
        updatedFlags.push('SHADOWBANNED')
        
        await supabase
          .from('users_profile')
          .update({ role_flags: updatedFlags })
          .eq('user_id', target_user_id)
      } else if (action_type === 'unshadowban') {
        // Remove SHADOWBANNED flag
        updatedFlags = updatedFlags.filter((flag: string) => flag !== 'SHADOWBANNED')
        
        await supabase
          .from('users_profile')
          .update({ role_flags: updatedFlags })
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