import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// POST /api/admin/verification/review - Review verification submission
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
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
      user_id,
      action, // 'approve' or 'reject'
      review_notes,
      rejection_reason
    } = body

    if (!user_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'reject' && !rejection_reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    // Get current submission
    const { data: submission, error: fetchError } = await supabase
      .from('verification_submissions')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Verification submission not found' }, { status: 404 })
    }

    if (submission.status !== 'pending') {
      return NextResponse.json({ error: 'Submission already processed' }, { status: 400 })
    }

    // Update submission status
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes,
      updated_at: new Date().toISOString()
    }

    if (action === 'reject') {
      updateData.rejection_reason = rejection_reason
    }

    const { error: updateError } = await supabase
      .from('verification_submissions')
      .update(updateData)
      .eq('user_id', user_id)

    if (updateError) {
      console.error('Error updating verification submission:', updateError)
      return NextResponse.json({ error: 'Failed to update verification submission' }, { status: 500 })
    }

    // If approved, update user profile and create verification badge
    if (action === 'approve') {
      // Update users_profile verification status
      const profileUpdate: any = {}
      switch (submission.verification_type) {
        case 'identity':
          profileUpdate.verified_id = true
          profileUpdate.age_verified = true
          break
        case 'professional':
          profileUpdate.verified_professional = true
          break
        case 'business':
          profileUpdate.verified_business = true
          break
      }

      const { error: profileError } = await supabase
        .from('users_profile')
        .update(profileUpdate)
        .eq('user_id', user_id)

      if (profileError) {
        console.error('Error updating user profile:', profileError)
      }

      // Create verification badge
      const badgeType = submission.verification_type === 'identity' ? 'verified_identity' :
                       submission.verification_type === 'professional' ? 'verified_professional' :
                       'verified_business'

      const { error: badgeError } = await supabase
        .from('verification_badges')
        .insert({
          user_id,
          badge_type: badgeType,
          issued_at: new Date().toISOString(),
          issued_by: user.id
        })

      if (badgeError) {
        console.error('Error creating verification badge:', badgeError)
      }
    }

    // If rejected, delete the document (GDPR compliance)
    if (action === 'reject' && submission.metadata?.document_url) {
      try {
        const { error: deleteError } = await supabase.storage
          .from('verification-documents')
          .remove([submission.metadata.document_url])

        if (deleteError) {
          console.error('Error deleting document:', deleteError)
        }
      } catch (error) {
        console.error('Error deleting document:', error)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`
    })

  } catch (error: any) {
    console.error('Review verification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
