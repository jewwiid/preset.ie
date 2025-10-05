import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile_id')

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 })
    }

    // Get user skills using the function
    const { data, error } = await supabase.rpc('get_user_skills', {
      p_profile_id: profileId
    })

    if (error) {
      console.error('Error fetching user skills:', error)
      return NextResponse.json({ error: 'Failed to fetch user skills' }, { status: 500 })
    }

    return NextResponse.json({ skills: data || [] })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    
    const {
      profile_id,
      skill_name,
      skill_type = 'creative',
      proficiency_level = 'intermediate',
      years_experience,
      description,
      is_featured = false
    } = body

    if (!profile_id || !skill_name) {
      return NextResponse.json({ error: 'Profile ID and skill name are required' }, { status: 400 })
    }

    // Upsert user skill
    const { data, error } = await supabase.rpc('upsert_user_skill', {
      p_profile_id: profile_id,
      p_skill_name: skill_name,
      p_skill_type: skill_type,
      p_proficiency_level: proficiency_level,
      p_years_experience: years_experience,
      p_description: description,
      p_is_featured: is_featured
    })

    if (error) {
      console.error('Error upserting user skill:', error)
      return NextResponse.json({ error: 'Failed to save skill' }, { status: 500 })
    }

    return NextResponse.json({ skill_id: data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile_id')
    const skillName = searchParams.get('skill_name')

    if (!profileId || !skillName) {
      return NextResponse.json({ error: 'Profile ID and skill name are required' }, { status: 400 })
    }

    // Delete user skill
    const { data, error } = await supabase.rpc('delete_user_skill', {
      p_profile_id: profileId,
      p_skill_name: skillName
    })

    if (error) {
      console.error('Error deleting user skill:', error)
      return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 })
    }

    return NextResponse.json({ success: data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
