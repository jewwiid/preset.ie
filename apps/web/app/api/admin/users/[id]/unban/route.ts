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
      .select('account_type')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_type?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { reason, notes } = body

    // Get current user flags
    const { data: targetUser } = await supabase
      .from('users_profile')
      .select('account_type')
      .eq('user_id', id)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove BANNED flag
    const updatedFlags = (targetUser.account_type || []).filter(
      (flag: string) => flag !== 'BANNED'
    )

    // Update user profile
    const { error: updateError } = await supabase
      .from('users_profile')
      .update({ account_type: updatedFlags })
      .eq('user_id', id)

    if (updateError) {
      console.error('Error unbanning user:', updateError)
      return NextResponse.json(
        { error: 'Failed to unban user' },
        { status: 500 }
      )
    }

    // Log moderation action
    await supabase
      .from('moderation_actions')
      .insert({
        admin_user_id: user.id,
        target_user_id: id,
        action_type: 'unban',
        reason: reason || 'Manual unban',
        notes
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error unbanning user:', error)
    return NextResponse.json(
      { error: 'Failed to unban user' },
      { status: 500 }
    )
  }
}