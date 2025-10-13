import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * PATCH /api/gigs/[id]/applications/[applicationId]
 *
 * Update application status and assign role when accepting applicants
 * Body: {
 *   status: 'ACCEPTED' | 'DECLINED' | 'SHORTLISTED',
 *   role_assigned?: string,  // Required when status is ACCEPTED
 *   role_title?: string,     // Optional custom role title
 *   credits_visible?: boolean // Whether to show in credits (default: true)
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { id: gigId, applicationId } = await params

    if (!gigId || !applicationId) {
      return NextResponse.json(
        { success: false, error: 'Gig ID and Application ID are required' },
        { status: 400 }
      )
    }

    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Verify user owns this gig
    const { data: gig } = await supabase
      .from('gigs')
      .select('owner_user_id, looking_for_types')
      .eq('id', gigId)
      .single()

    if (!gig || gig.owner_user_id !== profile.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not own this gig' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const {
      status,
      role_assigned,
      role_title,
      credits_visible = true
    } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['ACCEPTED', 'DECLINED', 'SHORTLISTED', 'PENDING']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be ACCEPTED, DECLINED, SHORTLISTED, or PENDING' },
        { status: 400 }
      )
    }

    // When accepting an application, role_assigned is required for proper crediting
    if (status === 'ACCEPTED' && !role_assigned) {
      return NextResponse.json(
        {
          success: false,
          error: 'role_assigned is required when accepting an application. Please specify the role (e.g., MODEL, PHOTOGRAPHER, MAKEUP_ARTIST)'
        },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Add role information when accepting
    if (status === 'ACCEPTED') {
      updateData.role_assigned = role_assigned
      updateData.role_title = role_title || role_assigned
      updateData.credits_visible = credits_visible
    }

    // Update application
    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
      .eq('gig_id', gigId)
      .select(`
        *,
        applicant:applicant_user_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating application:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update application' },
        { status: 500 }
      )
    }

    // Send notification to applicant about status change
    if (status === 'ACCEPTED' || status === 'DECLINED') {
      try {
        // Create notification
        await supabase.from('notifications').insert({
          recipient_id: updatedApplication.applicant_user_id,
          type: status === 'ACCEPTED' ? 'gig_application_accepted' : 'gig_application_rejected',
          title: status === 'ACCEPTED'
            ? `Your application was accepted!`
            : `Application update`,
          message: status === 'ACCEPTED'
            ? `Congratulations! Your application for the gig has been accepted${role_title ? ` as ${role_title}` : ''}.`
            : `Your application for the gig was not selected at this time.`,
          action_url: `/gigs/${gigId}`,
          metadata: {
            gig_id: gigId,
            application_id: applicationId,
            role_assigned,
            role_title
          }
        })
      } catch (notifError) {
        console.warn('Failed to send notification:', notifError)
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
      data: updatedApplication
    })
  } catch (error: any) {
    console.error('Error in update application API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/gigs/[id]/applications/[applicationId]
 *
 * Get details of a specific application
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { id: gigId, applicationId } = await params

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get application details
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:applicant_user_id (
          id,
          display_name,
          handle,
          avatar_url
        ),
        gig:gig_id (
          id,
          title,
          owner_user_id
        )
      `)
      .eq('id', applicationId)
      .eq('gig_id', gigId)
      .single()

    if (error || !application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: application
    })
  } catch (error: any) {
    console.error('Error in get application API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
