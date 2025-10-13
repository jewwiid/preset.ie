import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/users/[handle]/credits
 *
 * Returns complete credit history for a user including:
 * - Gigs where they were the director/producer
 * - Gigs where they were crew (with role)
 * - Showcases they created
 * - Showcases they were featured in
 * - Collaboration projects they participated in
 *
 * This endpoint provides a comprehensive portfolio/resume view
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params

    if (!handle) {
      return NextResponse.json(
        { success: false, error: 'User handle is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for full access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user profile by handle
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id, user_id, display_name, handle, avatar_url')
      .eq('handle', handle)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get complete credit history using the database function
    const { data: credits, error: creditsError } = await supabase.rpc('get_user_credit_history', {
      p_user_id: profile.id
    })

    if (creditsError) {
      console.error('Error fetching user credit history:', creditsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch credit history' },
        { status: 500 }
      )
    }

    // Group credits by type for easier consumption
    const groupedCredits = {
      gigs_as_director: credits?.filter((c: any) => c.project_type === 'GIG_OWNER') || [],
      gigs_as_crew: credits?.filter((c: any) => c.project_type === 'GIG_CREW') || [],
      showcases_as_creator: credits?.filter((c: any) => c.project_type === 'SHOWCASE_CREATOR') || [],
      showcases_as_talent: credits?.filter((c: any) => c.project_type === 'SHOWCASE_TALENT') || [],
      collaboration_projects: credits?.filter((c: any) => c.project_type === 'COLLAB_PROJECT') || [],
    }

    // Calculate statistics
    const stats = {
      total_projects: credits?.length || 0,
      gigs_directed: groupedCredits.gigs_as_director.length,
      gigs_as_crew: groupedCredits.gigs_as_crew.length,
      showcases_created: groupedCredits.showcases_as_creator.length,
      showcases_featured: groupedCredits.showcases_as_talent.length,
      collaborations: groupedCredits.collaboration_projects.length,
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: profile.id,
          display_name: profile.display_name,
          handle: profile.handle,
          avatar_url: profile.avatar_url,
        },
        credits: groupedCredits,
        all_credits: credits || [],
        stats,
      }
    })
  } catch (error: any) {
    console.error('Error in user credits API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
