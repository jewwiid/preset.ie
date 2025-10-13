import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/showcases/[id]/credits
 *
 * Returns complete credits for a showcase including:
 * - Creator (photographer/director)
 * - Talent (models/actors)
 * - Extended collaborators (makeup artists, stylists, etc.)
 * - Linked gig crew if showcase is from a gig
 *
 * This endpoint enables comprehensive attribution for all creative work
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showcaseId } = await params

    if (!showcaseId) {
      return NextResponse.json(
        { success: false, error: 'Showcase ID is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for full access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get complete showcase credits using the database function
    const { data: credits, error } = await supabase.rpc('get_showcase_credits', {
      p_showcase_id: showcaseId
    })

    if (error) {
      console.error('Error fetching showcase credits:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch showcase credits' },
        { status: 500 }
      )
    }

    if (!credits || credits.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Showcase not found' },
        { status: 404 }
      )
    }

    const showcaseCredits = credits[0]

    return NextResponse.json({
      success: true,
      data: {
        showcase_id: showcaseCredits.showcase_id,
        showcase_title: showcaseCredits.showcase_title,
        creator: showcaseCredits.creator,
        talent: showcaseCredits.talent,
        collaborators: showcaseCredits.collaborators || [],
        gig_crew: showcaseCredits.gig_crew || [],
        total_collaborators: showcaseCredits.total_collaborators || 0,
      }
    })
  } catch (error: any) {
    console.error('Error in showcase credits API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/showcases/[id]/credits
 *
 * Add collaborators to a showcase
 * Body: { collaborators: [{ user_id, role, role_title, display_order }] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showcaseId } = await params

    if (!showcaseId) {
      return NextResponse.json(
        { success: false, error: 'Showcase ID is required' },
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

    // Verify user owns this showcase
    const { data: showcase } = await supabase
      .from('showcases')
      .select('creator_user_id')
      .eq('id', showcaseId)
      .single()

    if (!showcase || showcase.creator_user_id !== profile.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not own this showcase' },
        { status: 403 }
      )
    }

    // Get collaborators from request body
    const { collaborators } = await request.json()

    if (!collaborators || !Array.isArray(collaborators)) {
      return NextResponse.json(
        { success: false, error: 'Collaborators array is required' },
        { status: 400 }
      )
    }

    // Validate collaborators structure
    for (const collab of collaborators) {
      if (!collab.user_id || !collab.role) {
        return NextResponse.json(
          { success: false, error: 'Each collaborator must have user_id and role' },
          { status: 400 }
        )
      }
    }

    // Update showcase with collaborators
    const { error: updateError } = await supabase
      .from('showcases')
      .update({ collaborators })
      .eq('id', showcaseId)

    if (updateError) {
      console.error('Error updating showcase collaborators:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update collaborators' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Collaborators updated successfully',
      data: { collaborators }
    })
  } catch (error: any) {
    console.error('Error in add showcase collaborators API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
