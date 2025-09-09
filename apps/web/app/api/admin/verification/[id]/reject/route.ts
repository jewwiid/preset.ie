import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// POST /api/admin/verification/[id]/reject - Reject verification
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
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
      rejection_reason,
      review_notes
    } = body

    // Validate required fields
    if (!rejection_reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    // Get verification request details
    const { data: request_data, error: requestError } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('id', params.id)
      .single()

    if (requestError || !request_data) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 })
    }

    if (request_data.status !== 'pending' && request_data.status !== 'reviewing') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 })
    }

    // Update verification request
    const { error: updateError } = await supabase
      .from('verification_requests')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        review_notes,
        rejection_reason,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error rejecting verification request:', updateError)
      return NextResponse.json({ error: 'Failed to reject verification request' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification request rejected'
    })
  } catch (error) {
    console.error('Reject verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}