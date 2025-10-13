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

    // Get user's saved images from playground gallery
    const { data: savedImages, error: galleryError } = await supabaseAdmin
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
        media_type,
        generation_metadata
      `)
      .eq('user_id', user.id)
      .eq('media_type', 'image') // Lowercase to match what we insert
      .order('created_at', { ascending: false })
      .limit(50) // Limit to 50 most recent images for moodboard selection

    if (galleryError) {
      console.error('Error fetching saved images:', galleryError)
      
      // Check if it's a table not found error
      if (galleryError.code === 'PGRST205' || galleryError.message.includes('Could not find the table')) {
        return NextResponse.json(
          { success: true, images: [] },
          { status: 200 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch saved images' },
        { status: 500 }
      )
    }

    // Transform the data to match what MoodboardBuilder expects
    const images = (savedImages || []).map(item => ({
      id: item.id,
      image_url: item.image_url,
      thumbnail_url: item.thumbnail_url,
      title: item.title || 'Generated Image',
      description: item.description,
      tags: item.tags || [],
      created_at: item.created_at,
      width: item.width,
      height: item.height,
      format: item.format,
      generation_metadata: item.generation_metadata || {}
    }))

    return NextResponse.json({
      success: true,
      images
    })

  } catch (error) {
    console.error('Saved images API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
