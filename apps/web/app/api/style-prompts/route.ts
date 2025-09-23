import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('style_prompts')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching style prompts:', error)
      return NextResponse.json({ error: 'Failed to fetch style prompts' }, { status: 500 })
    }

    return NextResponse.json({ stylePrompts: data })
  } catch (error) {
    console.error('Error in style-prompts GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { styleName, generationMode } = await request.json()

    const { data, error } = await supabase
      .from('style_prompts')
      .select('*')
      .eq('style_name', styleName)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching style prompt:', error)
      return NextResponse.json({ error: 'Style not found' }, { status: 404 })
    }

    const prompt = generationMode === 'image-to-image' 
      ? data.image_to_image_prompt 
      : data.text_to_image_prompt

    return NextResponse.json({ prompt })
  } catch (error) {
    console.error('Error in style-prompts POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
