import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { profile_id, specializations } = await request.json()

    if (!profile_id || !specializations || !Array.isArray(specializations)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Migrate specializations directly to user_skills table
    const migrationResults = []
    
    for (const specialization of specializations) {
      const { data, error } = await supabaseAdmin
        .from('user_skills')
        .upsert({
          profile_id: profile_id,
          skill_name: specialization,
          skill_type: 'creative',
          proficiency_level: 'intermediate',
          years_experience: null
        }, {
          onConflict: 'profile_id,skill_name'
        })
        .select()

      if (error) {
        console.error('Migration error for skill:', specialization, error)
        migrationResults.push({ skill: specialization, error: error.message })
      } else {
        migrationResults.push({ skill: specialization, success: true })
      }
    }

    const successCount = migrationResults.filter(r => r.success).length
    const errorCount = migrationResults.filter(r => r.error).length

    return NextResponse.json({ 
      success: true, 
      message: `Migrated ${successCount} specializations${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      results: migrationResults
    })

  } catch (error) {
    console.error('Migration API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
