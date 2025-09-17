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
    isPublic,
    generationMode,
    checkOnly
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

    // Check for duplicate presets (same user, same name, same style type, same prompt)
    const { data: existingPresets, error: checkError } = await supabaseAdmin
      .from('playground_style_presets')
      .select('id, name, style_type, prompt_template')
      .eq('user_id', user.id)
      .eq('name', name.trim())
      .eq('style_type', styleType)
      .eq('prompt_template', promptTemplate.trim())

    if (checkError) {
      throw new Error('Failed to check for duplicate presets')
    }

    // If exact duplicate exists, return the existing preset instead of creating new one
    if (existingPresets && existingPresets.length > 0) {
      const existingPreset = existingPresets[0]
      return NextResponse.json({ 
        success: true, 
        preset: existingPreset,
        message: 'Style preset already exists',
        isDuplicate: true
      })
    }

    // Check for similar presets (same user, same name, different prompt/style)
    const { data: similarPresets, error: similarError } = await supabaseAdmin
      .from('playground_style_presets')
      .select('id, name, style_type, prompt_template')
      .eq('user_id', user.id)
      .eq('name', name.trim())

    if (similarError) {
      throw new Error('Failed to check for similar presets')
    }

    // If similar preset exists (same name), suggest updating instead
    if (similarPresets && similarPresets.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'A style preset with this name already exists',
        suggestion: 'Please choose a different name or update the existing preset',
        existingPreset: similarPresets[0],
        isNameConflict: true
      }, { status: 409 })
    }

    // If this is just a check, return success without creating
    if (checkOnly) {
      return NextResponse.json({
        success: true,
        message: 'No duplicates found',
        isDuplicate: false,
        isNameConflict: false
      })
    }

    const { data: preset, error } = await supabaseAdmin
      .from('playground_style_presets')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        style_type: styleType,
        prompt_template: promptTemplate.trim(),
        intensity: intensity || 1.0,
        is_public: isPublic || false,
        generation_mode: generationMode || 'text-to-image'
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
    isPublic,
    generationMode
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

    // Check for duplicate presets if name, style type, or prompt template is being updated
    if (name !== undefined || styleType !== undefined || promptTemplate !== undefined) {
      const checkName = name !== undefined ? name.trim() : undefined
      const checkStyleType = styleType !== undefined ? styleType : undefined
      const checkPromptTemplate = promptTemplate !== undefined ? promptTemplate.trim() : undefined

      // Get current preset to compare
      const { data: currentPreset, error: currentError } = await supabaseAdmin
        .from('playground_style_presets')
        .select('name, style_type, prompt_template')
        .eq('id', presetId)
        .eq('user_id', user.id)
        .single()

      if (currentError) {
        throw new Error('Failed to fetch current preset')
      }

      // Check for exact duplicates (excluding the current preset being updated)
      const { data: existingPresets, error: checkError } = await supabaseAdmin
        .from('playground_style_presets')
        .select('id, name, style_type, prompt_template')
        .eq('user_id', user.id)
        .neq('id', presetId) // Exclude current preset
        .eq('name', checkName || currentPreset.name)
        .eq('style_type', checkStyleType || currentPreset.style_type)
        .eq('prompt_template', checkPromptTemplate || currentPreset.prompt_template)

      if (checkError) {
        throw new Error('Failed to check for duplicate presets')
      }

      // If exact duplicate exists, return the existing preset
      if (existingPresets && existingPresets.length > 0) {
        const existingPreset = existingPresets[0]
        return NextResponse.json({ 
          success: true, 
          preset: existingPreset,
          message: 'Style preset already exists',
          isDuplicate: true
        })
      }

      // Check for name conflicts (same name, different content)
      if (checkName && checkName !== currentPreset.name) {
        const { data: nameConflicts, error: nameError } = await supabaseAdmin
          .from('playground_style_presets')
          .select('id, name, style_type, prompt_template')
          .eq('user_id', user.id)
          .neq('id', presetId)
          .eq('name', checkName)

        if (nameError) {
          throw new Error('Failed to check for name conflicts')
        }

        if (nameConflicts && nameConflicts.length > 0) {
          return NextResponse.json({
            success: false,
            error: 'A style preset with this name already exists',
            suggestion: 'Please choose a different name or update the existing preset',
            existingPreset: nameConflicts[0],
            isNameConflict: true
          }, { status: 409 })
        }
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (styleType !== undefined) updateData.style_type = styleType
    if (promptTemplate !== undefined) updateData.prompt_template = promptTemplate.trim()
    if (intensity !== undefined) updateData.intensity = intensity
    if (isPublic !== undefined) updateData.is_public = isPublic
    if (generationMode !== undefined) updateData.generation_mode = generationMode

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
