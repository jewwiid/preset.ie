import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Calculate date 6 days ago
    const sixDaysAgo = new Date()
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)

    // Fetch user's playground projects from the last 6 days
    const { data: projects, error } = await supabaseAdmin
      .from('playground_projects')
      .select(`
        id,
        title,
        prompt,
        style,
        generated_images,
        credits_used,
        created_at,
        last_generated_at,
        status,
        metadata
      `)
      .eq('user_id', user.id)
      .gte('created_at', sixDaysAgo.toISOString())
      .order('last_generated_at', { ascending: false })
      .limit(50) // Limit to prevent large responses

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Filter out projects that have been saved to gallery
    const { data: savedProjects, error: savedError } = await supabaseAdmin
      .from('playground_gallery')
      .select('project_id')
      .eq('user_id', user.id)
      .not('project_id', 'is', null)

    if (savedError) {
      console.error('Error fetching saved projects:', savedError)
    }

    const savedProjectIds = new Set(savedProjects?.map(p => p.project_id) || [])
    
    // Filter out saved projects and projects with no images
    const filteredProjects = projects?.filter(project => 
      !savedProjectIds.has(project.id) && 
      project.generated_images && 
      Array.isArray(project.generated_images) && 
      project.generated_images.length > 0
    ) || []

    return NextResponse.json({
      generations: filteredProjects,
      total: filteredProjects.length
    })

  } catch (error) {
    console.error('Error fetching past generations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}