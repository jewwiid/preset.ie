import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/gigs/[id]/credits
 *
 * Returns complete credits for a gig including:
 * - Director/Producer (gig owner)
 * - All crew members with their assigned roles
 * - Role titles and visibility preferences
 *
 * This endpoint enables proper attribution for all contributors
 * including models, makeup artists, photographers, stylists, etc.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gigId } = await params

    if (!gigId) {
      return NextResponse.json(
        { success: false, error: 'Gig ID is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for full access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get complete gig credits using the database function
    const { data: credits, error } = await supabase.rpc('get_gig_credits', {
      p_gig_id: gigId
    })

    if (error) {
      console.error('Error fetching gig credits:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch gig credits' },
        { status: 500 }
      )
    }

    if (!credits || credits.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Gig not found' },
        { status: 404 }
      )
    }

    const gigCredits = credits[0]

    return NextResponse.json({
      success: true,
      data: {
        gig_id: gigCredits.gig_id,
        gig_title: gigCredits.gig_title,
        gig_status: gigCredits.gig_status,
        director: gigCredits.director,
        crew: gigCredits.crew || [],
        total_crew_count: gigCredits.total_crew_count || 0,
      }
    })
  } catch (error: any) {
    console.error('Error in gig credits API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
