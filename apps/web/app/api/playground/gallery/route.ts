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
        generation_metadata,
        project_id,
        used_in_moodboard,
        used_in_showcase
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

    return NextResponse.json({
      success: true,
      media: galleryMedia || [],
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