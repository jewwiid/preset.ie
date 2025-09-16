import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

// Manually load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local (from project root)
dotenv.config({ path: path.join(process.cwd(), '../../.env.local') })

export async function GET(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  const { searchParams } = new URL(request.url)
  const includePublic = searchParams.get('includePublic') === 'true'
  
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
    let query = supabaseAdmin
      .from('playground_style_presets')
      .select('*')
      .order('usage_count', { ascending: false })

    if (includePublic) {
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`)
    } else {
      query = query.eq('user_id', user.id)
    }

    const { data: presets, error } = await query

    if (error) {
      throw new Error('Failed to fetch style presets')
    }

    return NextResponse.json({ 
      success: true, 
      presets: presets || []
    })
  } catch (error) {
    console.error('Failed to get style presets:', error)
    return NextResponse.json({ error: 'Failed to get style presets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  const { 
    name, 
    description, 
    styleType, 
    promptTemplate, 
    intensity, 
    isPublic 
  } = await request.json()
  
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
    if (!name || !styleType || !promptTemplate) {
      return NextResponse.json(
        { error: 'Name, style type, and prompt template are required' },
        { status: 400 }
      )
    }

    const { data: preset, error } = await supabaseAdmin
      .from('playground_style_presets')
      .insert({
        user_id: user.id,
        name,
        description,
        style_type: styleType,
        prompt_template: promptTemplate,
        intensity: intensity || 1.0,
        is_public: isPublic || false
      })
      .select()
      .single()

    if (error) {
      throw new Error('Failed to create style preset')
    }

    return NextResponse.json({ 
      success: true, 
      preset 
    })
  } catch (error) {
    console.error('Failed to create style preset:', error)
    return NextResponse.json({ error: 'Failed to create style preset' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  const { 
    presetId, 
    name, 
    description, 
    styleType, 
    promptTemplate, 
    intensity, 
    isPublic 
  } = await request.json()
  
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
    if (!presetId) {
      return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (styleType !== undefined) updateData.style_type = styleType
    if (promptTemplate !== undefined) updateData.prompt_template = promptTemplate
    if (intensity !== undefined) updateData.intensity = intensity
    if (isPublic !== undefined) updateData.is_public = isPublic

    const { data: preset, error } = await supabaseAdmin
      .from('playground_style_presets')
      .update(updateData)
      .eq('id', presetId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error('Failed to update style preset')
    }

    return NextResponse.json({ 
      success: true, 
      preset 
    })
  } catch (error) {
    console.error('Failed to update style preset:', error)
    return NextResponse.json({ error: 'Failed to update style preset' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  const { searchParams } = new URL(request.url)
  const presetId = searchParams.get('presetId')

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
    if (!presetId) {
      return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('playground_style_presets')
      .delete()
      .eq('id', presetId)
      .eq('user_id', user.id)

    if (error) {
      throw new Error('Failed to delete style preset')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Style preset deleted successfully' 
    })
  } catch (error) {
    console.error('Failed to delete style preset:', error)
    return NextResponse.json({ error: 'Failed to delete style preset' }, { status: 500 })
  }
}
