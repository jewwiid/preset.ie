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
    const { duration_hours, reason, notes } = body

    if (!duration_hours || !reason) {
      return NextResponse.json(
        { error: 'Duration and reason are required' },
        { status: 400 }
      )
    }

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + duration_hours)

    // Create suspension
    const { error: suspensionError } = await supabase
      .from('user_suspensions')
      .insert({
        user_id: params.id,
        reason,
        expires_at: expiresAt.toISOString(),
        issued_by: user.id
      })

    if (suspensionError) {
      console.error('Error creating suspension:', suspensionError)
      return NextResponse.json(
        { error: 'Failed to suspend user' },
        { status: 500 }
      )
    }

    // Log moderation action
    await supabase
      .from('moderation_actions')
      .insert({
        admin_user_id: user.id,
        target_user_id: params.id,
        action_type: 'suspend',
        reason,
        notes,
        metadata: { duration_hours }
      })

    // Create violation
    await supabase
      .from('user_violations')
      .insert({
        user_id: params.id,
        violation_type: 'suspension',
        severity: duration_hours > 168 ? 'high' : 'medium',
        description: reason,
        source: 'admin_action'
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error suspending user:', error)
    return NextResponse.json(
      { error: 'Failed to suspend user' },
      { status: 500 }
    )
  }
}