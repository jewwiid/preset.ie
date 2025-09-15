import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user's moodboards
    const { data: moodboards, error: moodboardsError } = await supabase
      .from('moodboards')
      .select(`
        id,
        title,
        summary,
        created_at,
        updated_at,
        items
      `)
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false })

    if (moodboardsError) {
      console.error('Error fetching moodboards:', moodboardsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch moodboards' },
        { status: 500 }
      )
    }

    // Format the response
    const formattedMoodboards = moodboards.map(moodboard => ({
      id: moodboard.id,
      title: moodboard.title,
      description: moodboard.summary,
      items_count: Array.isArray(moodboard.items) ? moodboard.items.length : 0,
      created_at: moodboard.created_at,
      updated_at: moodboard.updated_at
    }))

    return NextResponse.json({
      success: true,
      moodboards: formattedMoodboards
    })

  } catch (error) {
    console.error('Moodboards API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
