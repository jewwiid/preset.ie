import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Deactivate all active suspensions
    const { error: suspensionError } = await supabase
      .from('user_suspensions')
      .update({ is_active: false })
      .eq('user_id', params.id)
      .eq('is_active', true)

    if (suspensionError) {
      console.error('Error removing suspension:', suspensionError)
      return NextResponse.json(
        { error: 'Failed to remove suspension' },
        { status: 500 }
      )
    }

    // Log moderation action
    await supabase
      .from('moderation_actions')
      .insert({
        admin_user_id: user.id,
        target_user_id: params.id,
        action_type: 'unsuspend',
        reason: reason || 'Manual unsuspension',
        notes
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error unsuspending user:', error)
    return NextResponse.json(
      { error: 'Failed to unsuspend user' },
      { status: 500 }
    )
  }
}