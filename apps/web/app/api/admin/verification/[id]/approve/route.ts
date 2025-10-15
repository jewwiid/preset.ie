import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/admin/verification/[id]/approve - Approve verification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      .select('account_type')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_type?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      review_notes,
      badge_expires_in_days = 365 // Default to 1 year
    } = body

    // Get verification request details
    const { data: request_data, error: requestError } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (requestError || !request_data) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 })
    }

    if (request_data.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 })
    }

    // Update verification request
    const { error: updateError } = await supabase
      .from('verification_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        review_notes,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating verification request:', updateError)
      return NextResponse.json({ error: 'Failed to update verification request' }, { status: 500 })
    }

    // Calculate badge expiration
    const expires_at = badge_expires_in_days 
      ? new Date(Date.now() + badge_expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null

    // Deactivate any existing badges of the same type
    const badge_type = `verified_${request_data.verification_type}`
    await supabase
      .from('verification_badges')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        revoke_reason: 'Superseded by new verification'
      })
      .eq('user_id', request_data.user_id)
      .eq('badge_type', badge_type)
      .eq('is_active', true)

    // Issue new badge
    const { data: badge, error: badgeError } = await supabase
      .from('verification_badges')
      .insert({
        user_id: request_data.user_id,
        badge_type,
        verification_request_id: id,
        issued_by: user.id,
        expires_at,
        is_active: true
      })
      .select()
      .single()

    if (badgeError) {
      console.error('Error creating badge:', badgeError)
      return NextResponse.json({ error: 'Failed to create verification badge' }, { status: 500 })
    }

    // Update user profile flags
    const flagMap: Record<string, string> = {
      'identity': 'VERIFIED_ID',
      'professional': 'VERIFIED_PRO',
      'business': 'VERIFIED_BUSINESS'
    }

    const flag = flagMap[request_data.verification_type]
    if (flag) {
      // Get current account_type
      const { data: userData } = await supabase
        .from('users_profile')
        .select('account_type')
        .eq('user_id', request_data.user_id)
        .single()
      
      let updatedFlags = userData?.account_type || []
      // Remove flag if it exists, then add it
      updatedFlags = updatedFlags.filter((f: string) => f !== flag)
      updatedFlags.push(flag)
      
      await supabase
        .from('users_profile')
        .update({ account_type: updatedFlags })
        .eq('user_id', request_data.user_id)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification approved successfully',
      badge
    })
  } catch (error) {
    console.error('Approve verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}