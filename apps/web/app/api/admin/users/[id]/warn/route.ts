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

    // Log moderation action
    await supabase
      .from('moderation_actions')
      .insert({
        admin_user_id: user.id,
        target_user_id: id,
        action_type: 'warning',
        reason,
        notes
      })

    // Create violation (low severity for warning)
    await supabase
      .from('user_violations')
      .insert({
        user_id: id,
        violation_type: 'warning',
        severity: 'low',
        description: reason,
        source: 'admin_action'
      })

    // TODO: Send notification to user about the warning

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error warning user:', error)
    return NextResponse.json(
      { error: 'Failed to warn user' },
      { status: 500 }
    )
  }
}