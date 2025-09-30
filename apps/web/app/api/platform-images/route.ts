import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Create admin client for platform image management
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageType = searchParams.get('type')
    const category = searchParams.get('category')
    const presetKey = searchParams.get('preset_key')
    const includeVisualAids = searchParams.get('include_visual_aids') === 'true'

    let query = supabaseAdmin
      .from('platform_images')
      .select(`
        *,
        preset_visual_aids (
          id,
          preset_key,
          visual_aid_type,
          display_title,
          display_description,
          is_primary,
          display_order
        )
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (imageType) {
      query = query.eq('image_type', imageType)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (presetKey && includeVisualAids) {
      query = query.contains('usage_context->preset_key', presetKey)
    }

    const { data: images, error } = await query

    if (error) {
      console.error('Error fetching platform images:', error)
      return NextResponse.json({ error: 'Failed to fetch platform images' }, { status: 500 })
    }

    // If requesting preset visual aids, filter and format the response
    if (presetKey && includeVisualAids) {
      const visualAids = images?.map(image => ({
        ...image,
        preset_visual_aids: image.preset_visual_aids?.filter((aid: any) => aid.preset_key === presetKey)
      })).filter(image => image.preset_visual_aids?.length > 0) || []

      return NextResponse.json({ visual_aids: visualAids })
    }

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Error in platform images API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // For now, allow any authenticated user to manage platform images
    // In production, you should implement proper admin role checking
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      image_key, 
      image_type, 
      category, 
      image_url, 
      thumbnail_url, 
      alt_text, 
      title, 
      description, 
      usage_context, 
      display_order 
    } = body

    // Validate required fields
    if (!image_key || !image_type || !image_url) {
      return NextResponse.json({ 
        error: 'Missing required fields: image_key, image_type, image_url' 
      }, { status: 400 })
    }

    const { data: image, error } = await supabaseAdmin
      .from('platform_images')
      .insert({
        image_key,
        image_type,
        category,
        image_url,
        thumbnail_url,
        alt_text,
        title,
        description,
        usage_context: usage_context || {},
        display_order: display_order || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating platform image:', error)
      return NextResponse.json({ error: 'Failed to create platform image' }, { status: 500 })
    }

    return NextResponse.json({ image }, { status: 201 })
  } catch (error) {
    console.error('Error in platform images POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // For now, allow any authenticated user to manage platform images
    // In production, you should implement proper admin role checking
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    const { data: image, error } = await supabaseAdmin
      .from('platform_images')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating platform image:', error)
      return NextResponse.json({ error: 'Failed to update platform image' }, { status: 500 })
    }

    return NextResponse.json({ image })
  } catch (error) {
    console.error('Error in platform images PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // For now, allow any authenticated user to manage platform images
    // In production, you should implement proper admin role checking
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('platform_images')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting platform image:', error)
      return NextResponse.json({ error: 'Failed to delete platform image' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in platform images DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
