import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: presetId } = await params

    if (!presetId) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      )
    }

    // Get the most recent featured request for this preset
    const { data: featuredRequest, error } = await supabase
      .from('featured_preset_requests')
      .select(`
        id,
        status,
        requested_at,
        reviewed_at,
        admin_notes,
        presets (
          id,
          is_featured
        )
      `)
      .eq('preset_id', presetId)
      .order('requested_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching featured request:', error)
      return NextResponse.json(
        { error: 'Failed to fetch featured status' },
        { status: 500 }
      )
    }

    // If no request exists, return null status
    if (!featuredRequest) {
      return NextResponse.json({
        status: null,
        message: 'No featured request found'
      })
    }

    return NextResponse.json({
      status: featuredRequest.status,
      requested_at: featuredRequest.requested_at,
      reviewed_at: featuredRequest.reviewed_at,
      admin_notes: featuredRequest.admin_notes,
      is_featured: (featuredRequest.presets as any)?.is_featured || false
    })

  } catch (error) {
    console.error('Featured status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
