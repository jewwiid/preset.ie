import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      console.log('No authorization header provided')
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Create two clients: one for user auth, one for admin operations
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Set the user's session to verify the token
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get user's playground gallery media (images)
    const { data: galleryMedia, error: galleryError } = await supabaseAdmin
      .from('playground_gallery')
      .select(`
        id,
        image_url,
        thumbnail_url,
        title,
        description,
        tags,
        created_at,
        width,
        height,
        format,
        project_id,
        used_in_moodboard,
        used_in_showcase,
        media_type,
        video_url,
        video_duration,
        video_resolution,
        video_format,
        generation_metadata
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (galleryError) {
      console.error('Error fetching gallery media:', galleryError)
      
      // Check if it's a table not found error
      if (galleryError.code === 'PGRST205' || galleryError.message.includes('Could not find the table')) {
        return NextResponse.json(
          { success: true, media: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } },
          { status: 200 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch gallery media' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('playground_gallery')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    // If count query fails (table doesn't exist), use 0
    const totalCount = countError ? 0 : (count || 0)

    // Add default generation_metadata for items that don't have it
    const mediaWithDefaults = (galleryMedia || []).map(item => ({
      ...item,
      generation_metadata: item.generation_metadata || {}
    }))

    return NextResponse.json({
      success: true,
      media: mediaWithDefaults,
      pagination: {
        page,
        limit,
        total: totalCount,
        total_pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Gallery API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}