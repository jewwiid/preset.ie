import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    
    // Get auth token from header (optional for public feed)
    const authHeader = request.headers.get('Authorization')
    let userId: string | null = null
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (!authError && user) {
        userId = user.id
      }
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    const showcaseType = searchParams.get('type') // 'moodboard', 'individual_image', or null for all
    const cinematicQuery = searchParams.get('cinematic_query') // Text search for cinematic parameters
    const directorStyle = searchParams.get('director_style') // Filter by director style
    const cameraAngle = searchParams.get('camera_angle') // Filter by camera angle
    const lightingStyle = searchParams.get('lighting_style') // Filter by lighting style
    const colorPalette = searchParams.get('color_palette') // Filter by color palette

    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Build query for showcases - simplified without join
    let query = supabase
      .from('showcases')
      .select(`
        id,
        title,
        description,
        creator_user_id,
        moodboard_id,
        showcase_type,
        individual_image_url,
        individual_image_title,
        individual_image_description,
        visibility,
        tags,
        likes_count,
        views_count,
        media_count,
        created_at,
        updated_at
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Add type filter if specified
    if (showcaseType && ['moodboard', 'individual_image'].includes(showcaseType)) {
      query = query.eq('showcase_type', showcaseType)
    }

    // Execute query
    const { data: showcases, error: showcasesError } = await query

    if (showcasesError) {
      console.error('Error fetching showcases:', showcasesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch showcases' },
        { status: 500 }
      )
    }

    // Handle empty showcases case
    if (!showcases || showcases.length === 0) {
      return NextResponse.json({
        success: true,
        showcases: [],
        pagination: {
          page,
          limit,
          total: 0,
          total_pages: 0
        }
      })
    }

    // If user is authenticated, check which showcases they've liked
    let likedShowcases: string[] = []
    if (userId) {
      const { data: likes } = await supabase
        .from('showcase_likes')
        .select('showcase_id')
        .eq('user_id', userId)
        .in('showcase_id', showcases.map(s => s.id))

      likedShowcases = likes?.map(like => like.showcase_id) || []
    }

    // Get creator profiles separately (only if there are showcases)
    let creatorProfiles: any[] = []
    if (showcases.length > 0) {
      const creatorIds = [...new Set(showcases.map(s => s.creator_user_id))]
      const { data: profiles } = await supabase
        .from('users_profile')
        .select('id, user_id, display_name, handle, avatar_url')
        .in('user_id', creatorIds)
      creatorProfiles = profiles || []
    }

    // Simplified - no cinematic filtering for now
    let filteredShowcases = showcases

    // Create a map for quick lookup
    const creatorMap = new Map(creatorProfiles.map(p => [p.user_id, p]))

    // Format the response
    const formattedShowcases = filteredShowcases.map(showcase => {
      const creatorProfile = creatorMap.get(showcase.creator_user_id)
      return {
        id: showcase.id,
        title: showcase.title,
        description: showcase.description,
        creator: {
          id: showcase.creator_user_id,
          display_name: creatorProfile?.display_name,
          handle: creatorProfile?.handle,
          avatar_url: creatorProfile?.avatar_url
        },
      showcase_type: showcase.showcase_type,
      moodboard_id: showcase.moodboard_id,
      individual_image_url: showcase.individual_image_url,
      individual_image_title: showcase.individual_image_title,
      individual_image_description: showcase.individual_image_description,
      visibility: showcase.visibility,
      tags: showcase.tags,
      likes_count: showcase.likes_count,
      views_count: showcase.views_count,
      media_count: showcase.media_count,
      created_at: showcase.created_at,
      updated_at: showcase.updated_at,
        media: [], // Simplified - no media for now
        is_liked: likedShowcases.includes(showcase.id)
      }
    })

    // Get total count for pagination
    let countQuery = supabase
      .from('showcases')
      .select('*', { count: 'exact', head: true })
      .eq('visibility', 'public')

    if (showcaseType && ['moodboard', 'individual_image'].includes(showcaseType)) {
      countQuery = countQuery.eq('showcase_type', showcaseType)
    }

    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      showcases: formattedShowcases,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Showcase feed API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
