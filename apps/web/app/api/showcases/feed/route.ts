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

    // Build query for showcases - include media_ids field
    let query = supabase
      .from('showcases')
      .select(`
        id,
        gig_id,
        creator_user_id,
        talent_user_id,
        media_ids,
        caption,
        tags,
        palette,
        visibility,
        likes_count,
        views_count,
        created_at,
        updated_at,
        individual_image_url,
        individual_image_title,
        individual_image_description,
        individual_image_width,
        individual_image_height
      `)
      .eq('visibility', 'PUBLIC')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Note: showcase_type filter removed as it doesn't exist in current schema

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
        .in('id', creatorIds)
      creatorProfiles = profiles || []
    }

    // Get media items for all showcases
    let mediaItems: any[] = []
    if (showcases.length > 0) {
      // Collect all unique media IDs from all showcases
      const allMediaIds = [...new Set(showcases.flatMap(s => s.media_ids || []))]
      
      if (allMediaIds.length > 0) {
        const { data: media, error: mediaError } = await supabase
          .from('media')
          .select('id, owner_user_id, type, bucket, path, width, height, duration, palette, blurhash, exif_json, visibility, created_at')
          .in('id', allMediaIds)
        
        mediaItems = media || []
      }
    }

    // Simplified - no cinematic filtering for now
    let filteredShowcases = showcases

    // Create maps for quick lookup
    const creatorMap = new Map(creatorProfiles.map(p => [p.id, p]))
    const mediaMap = new Map(mediaItems.map(m => [m.id, m]))

    // Format the response
    const formattedShowcases = filteredShowcases.map(showcase => {
      const creatorProfile = creatorMap.get(showcase.creator_user_id)
      
      // Get media items for this showcase (deduplicate first)
      const uniqueMediaIds = [...new Set(showcase.media_ids || [])]
      const showcaseMedia = uniqueMediaIds
        .map(mediaId => mediaMap.get(mediaId))
        .filter(Boolean) // Remove any undefined items
        .map(media => {
          // Handle external URLs vs Supabase storage URLs
          let url: string
          if (media.bucket === 'external' || media.exif_json?.external_url) {
            // For external URLs, use the path directly
            url = media.path
          } else {
            // For Supabase storage, construct the public URL
            const { data: { publicUrl } } = supabase.storage
              .from(media.bucket)
              .getPublicUrl(media.path)
            url = publicUrl
          }
          
          return {
            id: media.id,
            type: media.type.toLowerCase(),
            url: url,
            width: media.width,
            height: media.height,
            duration: media.duration,
            palette: media.palette,
            blurhash: media.blurhash,
            metadata: media.exif_json,
            created_at: media.created_at
          }
        })

      return {
        id: showcase.id,
        caption: showcase.caption,
        creator: {
          id: showcase.creator_user_id,
          display_name: creatorProfile?.display_name,
          handle: creatorProfile?.handle,
          avatar_url: creatorProfile?.avatar_url
        },
        visibility: showcase.visibility,
        tags: showcase.tags || [],
        palette: showcase.palette,
        likes_count: showcase.likes_count || 0,
        views_count: showcase.views_count || 0,
        created_at: showcase.created_at,
        updated_at: showcase.updated_at,
        media: showcaseMedia,
        media_count: showcaseMedia.length,
        is_liked: likedShowcases.includes(showcase.id),
        individual_image_url: showcase.individual_image_url,
        individual_image_title: showcase.individual_image_title,
        individual_image_description: showcase.individual_image_description,
        individual_image_width: showcase.individual_image_width,
        individual_image_height: showcase.individual_image_height
      }
    })

    // Get total count for pagination
    let countQuery = supabase
      .from('showcases')
      .select('*', { count: 'exact', head: true })
      .eq('visibility', 'PUBLIC')

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
