import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get all active edit presets with their edit type information
    const { data: presets, error } = await supabase
      .from('edit_presets')
      .select(`
        *,
        edit_type:edit_types!inner(
          type_key,
          display_name,
          description,
          credit_cost,
          requires_reference_image,
          icon_emoji,
          category_key
        )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching edit presets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch edit presets' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: presets
    })

  } catch (error) {
    console.error('Unexpected error in edit presets API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { preset_name, description, edit_type_key, default_prompt, default_strength, sort_order } = body

    // Validate required fields
    if (!preset_name || !edit_type_key) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert new edit preset
    const { data, error } = await supabase
      .from('edit_presets')
      .insert({
        preset_name,
        description,
        edit_type_key,
        default_prompt,
        default_strength: default_strength || 0.8,
        sort_order: sort_order || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating edit preset:', error)
      return NextResponse.json(
        { error: 'Failed to create edit preset' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Unexpected error in edit presets POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
