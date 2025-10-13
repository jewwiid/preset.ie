import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Fetch quick prompts
    const { data: quickPrompts, error: promptsError } = await supabase
      .from('enhancement_quick_prompts')
      .select('*')
      .eq('is_active', true)
      .order('enhancement_type')
      .order('display_order')

    if (promptsError) {
      console.error('Error fetching quick prompts:', promptsError)
      throw promptsError
    }

    // Fetch presets
    const { data: presets, error: presetsError } = await supabase
      .from('enhancement_presets')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    if (presetsError) {
      console.error('Error fetching presets:', presetsError)
      throw presetsError
    }

    // Group quick prompts by enhancement type
    const groupedPrompts = {
      lighting: quickPrompts?.filter(p => p.enhancement_type === 'lighting') || [],
      style: quickPrompts?.filter(p => p.enhancement_type === 'style') || [],
      background: quickPrompts?.filter(p => p.enhancement_type === 'background') || [],
      mood: quickPrompts?.filter(p => p.enhancement_type === 'mood') || []
    }

    return NextResponse.json({
      success: true,
      quickPrompts: groupedPrompts,
      presets: presets || []
    })
  } catch (error: any) {
    console.error('Enhancement presets API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch enhancement presets' },
      { status: 500 }
    )
  }
}
