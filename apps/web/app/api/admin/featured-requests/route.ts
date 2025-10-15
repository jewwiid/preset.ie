import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Helper function to check admin authorization
async function checkAdminAuth(request: NextRequest): Promise<{ authorized: boolean; userId?: string; error?: NextResponse }> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }
  }

  // Check if user has admin role in their profile
  const { data: profile } = await supabase
    .from('users_profile')
    .select('account_type')
    .eq('user_id', user.id)
    .maybeSingle() // Use maybeSingle to handle case where profile doesn't exist

  if (!profile?.account_type?.includes('ADMIN')) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }
  }

  return { authorized: true, userId: user.id }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authCheck = await checkAdminAuth(request)
    if (!authCheck.authorized) {
      return authCheck.error!
    }

    // Get all pending featured requests with preset details
    const { data: requests, error } = await supabase
      .from('featured_preset_requests')
      .select(`
        *,
        presets (
          id,
          name,
          description,
          category,
          prompt_template,
          is_public,
          is_featured,
          created_at,
          user_id
        )
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending featured requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch featured requests' },
        { status: 500 }
      )
    }

    // Get user details for each request
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(request.requester_id)
        
        return {
          ...request,
          requester: userError ? 
            { id: request.requester_id, email: 'Unknown', raw_user_meta_data: {} } :
            { 
              id: userData.user.id, 
              email: userData.user.email,
              raw_user_meta_data: userData.user.user_metadata || {}
            }
        }
      })
    )

    return NextResponse.json({ requests: requestsWithUsers })

  } catch (error) {
    console.error('Admin featured requests GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check admin authorization
    const authCheck = await checkAdminAuth(request)
    if (!authCheck.authorized) {
      return authCheck.error!
    }

    const { request_id, status, admin_notes, reviewed_by } = await request.json()

    if (!request_id || !status || !reviewed_by) {
      return NextResponse.json(
        { error: 'Missing required fields: request_id, status, reviewed_by' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "approved" or "rejected"' },
        { status: 400 }
      )
    }

    // Validate UUID format for reviewed_by
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(reviewed_by)) {
      return NextResponse.json(
        { error: 'Invalid reviewed_by UUID format' },
        { status: 400 }
      )
    }

    // First, get the request to find the preset_id
    const { data: existingRequest, error: fetchError } = await supabase
      .from('featured_preset_requests')
      .select('preset_id, status')
      .eq('id', request_id)
      .single()

    if (fetchError || !existingRequest) {
      console.error('Error fetching featured request:', fetchError)
      return NextResponse.json(
        { error: 'Featured request not found' },
        { status: 404 }
      )
    }

    // Update the featured request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('featured_preset_requests')
      .update({
        status,
        reviewed_by,
        reviewed_at: new Date().toISOString(),
        admin_notes
      })
      .eq('id', request_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating featured request:', updateError)
      return NextResponse.json(
        { error: `Failed to update featured request: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Update the preset's featured status based on the decision
    const newFeaturedStatus = status === 'approved'
    const { error: presetUpdateError } = await supabase
      .from('presets')
      .update({ is_featured: newFeaturedStatus })
      .eq('id', existingRequest.preset_id)

    if (presetUpdateError) {
      console.error('Error updating preset featured status:', presetUpdateError)
      return NextResponse.json(
        { error: `Failed to update preset featured status: ${presetUpdateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Featured request ${status} successfully`,
      request: updatedRequest
    })

  } catch (error) {
    console.error('Admin featured requests PATCH API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
