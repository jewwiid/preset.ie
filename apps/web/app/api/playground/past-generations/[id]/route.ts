import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: projectId } = await params

    // First, check if the project exists and belongs to the user
    const { data: project, error: projectError } = await supabaseAdmin
      .from('playground_projects')
      .select('id, user_id, status')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if project has been saved to gallery
    const { data: savedProject, error: savedError } = await supabaseAdmin
      .from('playground_gallery')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (savedError && savedError.code !== 'PGRST116') {
      console.error('Error checking saved project:', savedError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (savedProject) {
      return NextResponse.json({ 
        error: 'Cannot delete project that has been saved to gallery' 
      }, { status: 400 })
    }

    // Delete related image edits first (due to foreign key constraints)
    const { error: editsError } = await supabaseAdmin
      .from('playground_image_edits')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id)

    if (editsError) {
      console.error('Error deleting image edits:', editsError)
      return NextResponse.json({ error: 'Failed to delete related edits' }, { status: 500 })
    }

    // Delete the project
    const { error: deleteError } = await supabaseAdmin
      .from('playground_projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting project:', deleteError)
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Project deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}