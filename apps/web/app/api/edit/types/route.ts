import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get all active edit types with their categories
    const { data: editTypes, error: editTypesError } = await supabase
      .from('edit_types')
      .select(`
        *,
        category:edit_type_categories!inner(
          category_key,
          display_name,
          description,
          sort_order
        )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (editTypesError) {
      console.error('Error fetching edit types:', editTypesError)
      return NextResponse.json(
        { error: 'Failed to fetch edit types' },
        { status: 500 }
      )
    }

    // Get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('edit_type_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // Group edit types by category
    const categorizedTypes = categories.map(category => ({
      ...category,
      edit_types: editTypes.filter(type => type.category_key === category.category_key)
    }))

    return NextResponse.json({
      success: true,
      data: {
        categories: categorizedTypes,
        all_types: editTypes
      }
    })

  } catch (error) {
    console.error('Unexpected error in edit types API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type_key, display_name, description, category_key, credit_cost, requires_reference_image, prompt_placeholder, icon_emoji, sort_order } = body

    // Validate required fields
    if (!type_key || !display_name || !description || !category_key || !credit_cost) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert new edit type
    const { data, error } = await supabase
      .from('edit_types')
      .insert({
        type_key,
        display_name,
        description,
        category_key,
        credit_cost,
        requires_reference_image: requires_reference_image || false,
        prompt_placeholder,
        icon_emoji,
        sort_order: sort_order || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating edit type:', error)
      return NextResponse.json(
        { error: 'Failed to create edit type' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Unexpected error in edit types POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
