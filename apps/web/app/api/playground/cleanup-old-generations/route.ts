import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Check for cleanup token for security
    const cleanupToken = request.headers.get('x-cleanup-token')
    const expectedToken = process.env.CLEANUP_TOKEN || 'default-cleanup-token'
    
    if (!cleanupToken || cleanupToken !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate date 6 days ago
    const sixDaysAgo = new Date()
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)

    // Get all projects older than 6 days
    const { data: oldProjects, error: fetchError } = await supabaseAdmin
      .from('playground_projects')
      .select(`
        id,
        user_id,
        status,
        created_at
      `)
      .lt('created_at', sixDaysAgo.toISOString())
      .neq('status', 'saved') // Don't delete saved projects

    if (fetchError) {
      console.error('Error fetching old projects:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!oldProjects || oldProjects.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No old projects to clean up',
        deletedCount: 0
      })
    }

    // Get all saved projects to avoid deleting them
    const { data: savedProjects, error: savedError } = await supabaseAdmin
      .from('playground_gallery')
      .select('project_id')
      .not('project_id', 'is', null)

    if (savedError) {
      console.error('Error fetching saved projects:', savedError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const savedProjectIds = new Set(savedProjects?.map(p => p.project_id) || [])
    
    // Filter out projects that have been saved to gallery
    const projectsToDelete = oldProjects.filter(project => 
      !savedProjectIds.has(project.id)
    )

    if (projectsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unsaved old projects to clean up',
        deletedCount: 0
      })
    }

    const projectIds = projectsToDelete.map(p => p.id)

    // Delete related image edits first (due to foreign key constraints)
    const { error: editsError } = await supabaseAdmin
      .from('playground_image_edits')
      .delete()
      .in('project_id', projectIds)

    if (editsError) {
      console.error('Error deleting image edits:', editsError)
      return NextResponse.json({ error: 'Failed to delete related edits' }, { status: 500 })
    }

    // Delete the old projects
    const { error: deleteError } = await supabaseAdmin
      .from('playground_projects')
      .delete()
      .in('id', projectIds)

    if (deleteError) {
      console.error('Error deleting projects:', deleteError)
      return NextResponse.json({ error: 'Failed to delete projects' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${projectsToDelete.length} old projects`,
      deletedCount: projectsToDelete.length,
      cutoffDate: sixDaysAgo.toISOString()
    })

  } catch (error) {
    console.error('Error during cleanup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}