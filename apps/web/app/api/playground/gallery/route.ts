import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get user's playground gallery media (images and videos)
    const { data: galleryMedia, error: galleryError } = await supabaseAdmin
      .from('playground_gallery')
      .select(`
        id,
        media_type,
        image_url,
        video_url,
        thumbnail_url,
        title,
        description,
        tags,
        created_at,
        width,
        height,
        video_duration,
        video_resolution,
        video_format,
        generation_metadata,
        project_id
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (galleryError) {
      console.error('Error fetching gallery media:', galleryError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch gallery media' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('playground_gallery')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      media: galleryMedia || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
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