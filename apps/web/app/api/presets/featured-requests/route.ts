import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { preset_id, requester_id } = await request.json()

    if (!preset_id || !requester_id) {
      return NextResponse.json(
        { error: 'Missing required fields: preset_id and requester_id' },
        { status: 400 }
      )
    }

    // Check if preset exists and belongs to the requester
    const { data: preset, error: presetError } = await supabase
      .from('presets')
      .select('id, user_id, name')
      .eq('id', preset_id)
      .single()

    if (presetError || !preset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      )
    }

    if (preset.user_id !== requester_id) {
      return NextResponse.json(
        { error: 'You can only request featured status for your own presets' },
        { status: 403 }
      )
    }

    // Check if there's already a pending request for this preset
    const { data: existingRequest, error: existingError } = await supabase
      .from('featured_preset_requests')
      .select('id, status')
      .eq('preset_id', preset_id)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A featured request is already pending for this preset' },
        { status: 409 }
      )
    }

    // Create the featured request
    const { data: featuredRequest, error: createError } = await supabase
      .from('featured_preset_requests')
      .insert({
        preset_id,
        requester_id,
        status: 'pending'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating featured request:', createError)
      return NextResponse.json(
        { error: 'Failed to create featured request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Featured request submitted successfully',
      request_id: featuredRequest.id
    })

  } catch (error) {
    console.error('Featured request API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const requester_id = searchParams.get('requester_id')

    let query = supabase
      .from('featured_preset_requests')
      .select(`
        *,
        presets (
          id,
          name,
          description,
          category,
          is_public,
          is_featured
        )
      `)

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Filter by requester if provided
    if (requester_id) {
      query = query.eq('requester_id', requester_id)
    }

    const { data: requests, error } = await query.order('requested_at', { ascending: false })

    if (error) {
      console.error('Error fetching featured requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch featured requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ requests })

  } catch (error) {
    console.error('Featured requests GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
