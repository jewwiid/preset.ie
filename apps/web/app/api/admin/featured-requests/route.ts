import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
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
        ),
        requester:requester_id (
          id,
          email,
          raw_user_meta_data
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

    return NextResponse.json({ requests })

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
      .select(`
        *,
        presets (
          id,
          name,
          is_featured
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating featured request:', updateError)
      return NextResponse.json(
        { error: 'Failed to update featured request' },
        { status: 500 }
      )
    }

    // Update the preset's featured status based on the decision
    const newFeaturedStatus = status === 'approved'
    const { error: presetUpdateError } = await supabase
      .from('presets')
      .update({ is_featured: newFeaturedStatus })
      .eq('id', updatedRequest.presets.id)

    if (presetUpdateError) {
      console.error('Error updating preset featured status:', presetUpdateError)
      return NextResponse.json(
        { error: 'Failed to update preset featured status' },
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
