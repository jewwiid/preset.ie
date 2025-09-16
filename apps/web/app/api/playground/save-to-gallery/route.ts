import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

// Manually load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local (from project root)
dotenv.config({ path: path.join(process.cwd(), '../../.env.local') })

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  const { imageUrl, title, description, tags, projectId, editId } = await request.json()
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
  
  try {
    // For now, save the original image URL directly to avoid storage bucket issues
    // TODO: Implement proper image storage and thumbnail generation
    
    // Save to gallery
    const { data: galleryItem, error: insertError } = await supabaseAdmin
      .from('playground_gallery')
      .insert({
        user_id: user.id,
        project_id: projectId,
        edit_id: editId,
        image_url: imageUrl,
        thumbnail_url: imageUrl, // Use original URL as thumbnail for now
        title: title || 'Untitled',
        description,
        tags: tags || [],
        width: 1024, // Default, could extract from image
        height: 1024,
        file_size: 0, // Unknown size for external URLs
        format: 'jpg'
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Gallery insert error:', insertError)
      throw insertError
    }
    
    return NextResponse.json({ 
      success: true, 
      galleryItem 
    })
  } catch (error) {
    console.error('Failed to save to gallery:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save to gallery',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
