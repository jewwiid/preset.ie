import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'headshot' or 'product'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!type || !['headshot', 'product'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "headshot" or "product"' },
        { status: 400 }
      )
    }

    // Define category mappings
    const categoryMap = {
      headshot: ['headshot', 'corporate_portrait', 'linkedin_photo', 'professional_portrait', 'business_headshot'],
      product: ['product_photography', 'ecommerce', 'product_catalog', 'product_lifestyle', 'product_studio']
    }

    const categories = categoryMap[type as keyof typeof categoryMap]

    // Query presets with the specified categories
    const { data: presets, error } = await supabase
      .from('presets')
      .select(`
        id,
        name,
        description,
        category,
        prompt_template,
        negative_prompt,
        style_settings,
        technical_settings,
        ai_metadata,
        usage_count,
        is_public,
        is_featured,
        created_at,
        updated_at,
        creator:user_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .in('category', categories)
      .eq('is_public', true)
      .order('usage_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching specialized presets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch presets' },
        { status: 500 }
      )
    }

    // Add specialized metadata
    const enhancedPresets = presets?.map(preset => ({
      ...preset,
      specialized_type: type,
      specialization: preset.ai_metadata?.specialization || `${type}_photography`,
      use_case: preset.ai_metadata?.use_case || `${type}_generation`,
      optimized_for: type === 'headshot' ? 'Professional networking and business profiles' : 'E-commerce and product marketing'
    })) || []

    return NextResponse.json({
      presets: enhancedPresets,
      type,
      count: enhancedPresets.length,
      categories_queried: categories
    })

  } catch (error) {
    console.error('Error in specialized presets API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, presetData } = body

    if (!type || !['headshot', 'product'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "headshot" or "product"' },
        { status: 400 }
      )
    }

    // Set default category based on type
    const defaultCategory = type === 'headshot' ? 'headshot' : 'product_photography'
    
    const preset = {
      ...presetData,
      category: presetData.category || defaultCategory,
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('presets')
      .insert([preset])
      .select()
      .single()

    if (error) {
      console.error('Error creating specialized preset:', error)
      return NextResponse.json(
        { error: 'Failed to create preset' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      preset: data,
      message: `${type} preset created successfully`
    })

  } catch (error) {
    console.error('Error creating specialized preset:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
