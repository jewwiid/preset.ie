import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Create admin client for preset visual aids management
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const presetKey = searchParams.get('preset_key')
    const visualAidType = searchParams.get('type')

    let query = supabaseAdmin
      .from('preset_visual_aids')
      .select(`
        *,
        platform_images (
          id,
          image_key,
          image_url,
          thumbnail_url,
          alt_text,
          title,
          description,
          width,
          height,
          usage_context
        )
      `)
      .order('display_order', { ascending: true })

    if (presetKey) {
      query = query.eq('preset_key', presetKey)
    }

    if (visualAidType) {
      query = query.eq('visual_aid_type', visualAidType)
    }

    const { data: visualAids, error } = await query

    if (error) {
      console.error('Error fetching preset visual aids:', error)
      return NextResponse.json({ error: 'Failed to fetch preset visual aids' }, { status: 500 })
    }

    return NextResponse.json({ visual_aids: visualAids })
  } catch (error) {
    console.error('Error in preset visual aids API:', error)
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

    // For now, allow any authenticated user to manage preset visual aids
    // In production, you should implement proper admin role checking
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      preset_key, 
      platform_image_id, 
      visual_aid_type, 
      display_title, 
      display_description, 
      is_primary, 
      display_order 
    } = body

    // Validate required fields
    if (!preset_key || !platform_image_id || !visual_aid_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: preset_key, platform_image_id, visual_aid_type' 
      }, { status: 400 })
    }

    const { data: visualAid, error } = await supabaseAdmin
      .from('preset_visual_aids')
      .insert({
        preset_key,
        platform_image_id,
        visual_aid_type,
        display_title,
        display_description,
        is_primary: is_primary || false,
        display_order: display_order || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating preset visual aid:', error)
      return NextResponse.json({ error: 'Failed to create preset visual aid' }, { status: 500 })
    }

    return NextResponse.json({ visual_aid: visualAid }, { status: 201 })
  } catch (error) {
    console.error('Error in preset visual aids POST API:', error)
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

    // For now, allow any authenticated user to manage preset visual aids
    // In production, you should implement proper admin role checking
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Visual aid ID is required' }, { status: 400 })
    }

    const { data: visualAid, error } = await supabaseAdmin
      .from('preset_visual_aids')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating preset visual aid:', error)
      return NextResponse.json({ error: 'Failed to update preset visual aid' }, { status: 500 })
    }

    return NextResponse.json({ visual_aid: visualAid })
  } catch (error) {
    console.error('Error in preset visual aids PUT API:', error)
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

    // For now, allow any authenticated user to manage preset visual aids
    // In production, you should implement proper admin role checking
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Visual aid ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('preset_visual_aids')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting preset visual aid:', error)
      return NextResponse.json({ error: 'Failed to delete preset visual aid' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in preset visual aids DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
