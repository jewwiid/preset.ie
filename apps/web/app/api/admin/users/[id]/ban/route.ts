import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('role_flags')
      .eq('user_id', user.id)
      .single()

    if (!profile?.role_flags?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { reason, notes } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

    // Get current user flags
    const { data: targetUser } = await supabase
      .from('users_profile')
      .select('role_flags')
      .eq('user_id', id)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Add BANNED flag
    const updatedFlags = targetUser.role_flags || []
    if (!updatedFlags.includes('BANNED')) {
      updatedFlags.push('BANNED')
    }

    // Update user profile with BANNED flag
    const { error: updateError } = await supabase
      .from('users_profile')
      .update({ role_flags: updatedFlags })
      .eq('user_id', id)

    if (updateError) {
      console.error('Error banning user:', updateError)
      return NextResponse.json(
        { error: 'Failed to ban user' },
        { status: 500 }
      )
    }

    // Log moderation action
    await supabase
      .from('moderation_actions')
      .insert({
        admin_user_id: user.id,
        target_user_id: id,
        action_type: 'ban',
        reason,
        notes
      })

    // Create violation
    await supabase
      .from('user_violations')
      .insert({
        user_id: id,
        violation_type: 'ban',
        severity: 'critical',
        description: reason,
        source: 'admin_action'
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error banning user:', error)
    return NextResponse.json(
      { error: 'Failed to ban user' },
      { status: 500 }
    )
  }
}