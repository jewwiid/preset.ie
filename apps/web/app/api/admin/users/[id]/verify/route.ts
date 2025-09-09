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
    const { verification_type = 'manual', notes } = body

    // Get current user flags
    const { data: targetUser } = await supabase
      .from('users_profile')
      .select('role_flags')
      .eq('user_id', id)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Add VERIFIED_ID flag
    const updatedFlags = targetUser.role_flags || []
    if (!updatedFlags.includes('VERIFIED_ID')) {
      updatedFlags.push('VERIFIED_ID')
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('users_profile')
      .update({ role_flags: updatedFlags })
      .eq('user_id', id)

    if (updateError) {
      console.error('Error verifying user:', updateError)
      return NextResponse.json(
        { error: 'Failed to verify user' },
        { status: 500 }
      )
    }

    // Create verification badge
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 year validity

    await supabase
      .from('verification_badges')
      .insert({
        user_id: id,
        verification_type,
        issued_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        issued_by: user.id
      })

    // Log moderation action
    await supabase
      .from('moderation_actions')
      .insert({
        admin_user_id: user.id,
        target_user_id: id,
        action_type: 'verify',
        reason: 'Manual verification',
        notes,
        metadata: { verification_type }
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error verifying user:', error)
    return NextResponse.json(
      { error: 'Failed to verify user' },
      { status: 500 }
    )
  }
}