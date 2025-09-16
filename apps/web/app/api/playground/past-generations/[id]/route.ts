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

    const { id: itemId } = await params
    const { permanent } = await request.json().catch(() => ({ permanent: false }))

    console.log('🗑️ Deleting Past Generation item:', { itemId, permanent, userId: user.id })

    // Determine item type based on ID prefix
    let deletedCount = 0
    let itemType = 'unknown'

    if (itemId.startsWith('edit_')) {
      // Handle individual image edits
      const editId = itemId.replace('edit_', '')
      const { error: editError } = await supabaseAdmin
        .from('playground_image_edits')
        .delete()
        .eq('id', editId)
        .eq('user_id', user.id)

      if (editError) {
        console.error('Error deleting image edit:', editError)
        return NextResponse.json({ error: 'Failed to delete image edit' }, { status: 500 })
      }

      deletedCount = 1
      itemType = 'image edit'

    } else if (itemId.startsWith('video_')) {
      // Handle videos from gallery
      const videoId = itemId.replace('video_', '')
      const { error: videoError } = await supabaseAdmin
        .from('playground_gallery')
        .delete()
        .eq('id', videoId)
        .eq('user_id', user.id)
        .eq('media_type', 'video')

      if (videoError) {
        console.error('Error deleting video:', videoError)
        return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
      }

      deletedCount = 1
      itemType = 'video'

    } else if (itemId.startsWith('video_gen_')) {
      // Handle video generations
      const videoGenId = itemId.replace('video_gen_', '')
      const { error: videoGenError } = await supabaseAdmin
        .from('playground_video_generations')
        .delete()
        .eq('id', videoGenId)
        .eq('user_id', user.id)

      if (videoGenError) {
        console.error('Error deleting video generation:', videoGenError)
        return NextResponse.json({ error: 'Failed to delete video generation' }, { status: 500 })
      }

      deletedCount = 1
      itemType = 'video generation'

    } else {
      // Handle regular image projects
      const projectId = itemId

      // Check if project exists and belongs to the user
      console.log('🔍 Checking project existence:', { projectId, userId: user.id })
      const { data: project, error: projectError } = await supabaseAdmin
        .from('playground_projects')
        .select('id, user_id, status')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single()

      if (projectError) {
        console.error('❌ Project lookup error:', projectError)
        return NextResponse.json({ 
          error: 'Project lookup failed', 
          details: projectError.message 
        }, { status: 500 })
      }

      if (!project) {
        console.log('❌ Project not found:', { projectId, userId: user.id })
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      console.log('✅ Project found:', project)

      // If not permanent delete, check if project has been saved to gallery
      if (!permanent) {
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
            error: 'Cannot delete project that has been saved to gallery. Use permanent delete to force removal.',
            requiresPermanent: true
          }, { status: 400 })
        }
      }

      // If permanent delete, also remove from gallery
      if (permanent) {
        const { error: galleryError } = await supabaseAdmin
          .from('playground_gallery')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', user.id)

        if (galleryError) {
          console.error('Error deleting from gallery:', galleryError)
          // Continue with deletion even if gallery deletion fails
        }
      }

      // Delete related image edits first (due to foreign key constraints)
      console.log('🗑️ Deleting related image edits...')
      const { error: editsError } = await supabaseAdmin
        .from('playground_image_edits')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.id)

      if (editsError) {
        console.error('❌ Error deleting image edits:', editsError)
        return NextResponse.json({ error: 'Failed to delete related edits' }, { status: 500 })
      }
      console.log('✅ Image edits deleted successfully')

      // Delete related batch jobs
      const { error: batchJobsError } = await supabaseAdmin
        .from('playground_batch_jobs')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.id)

      if (batchJobsError) {
        console.error('Error deleting batch jobs:', batchJobsError)
        // Continue with deletion even if batch jobs deletion fails
      }

      // Delete related usage analytics
      const { error: analyticsError } = await supabaseAdmin
        .from('playground_usage_analytics')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.id)

      if (analyticsError) {
        console.error('Error deleting usage analytics:', analyticsError)
        // Continue with deletion even if analytics deletion fails
      }

      // Delete the project
      console.log('🗑️ Deleting main project...')
      const { error: deleteError } = await supabaseAdmin
        .from('playground_projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('❌ Error deleting project:', deleteError)
        return NextResponse.json({ 
          error: 'Failed to delete project', 
          details: deleteError.message,
          code: deleteError.code 
        }, { status: 500 })
      }
      console.log('✅ Project deleted successfully')

      deletedCount = 1
      itemType = 'image project'
    }

    if (deletedCount === 0) {
      return NextResponse.json({ error: 'Item not found or already deleted' }, { status: 404 })
    }

    console.log(`✅ Successfully deleted ${itemType}:`, itemId)

    return NextResponse.json({ 
      success: true,
      message: `${itemType} deleted successfully`,
      itemType,
      permanent
    })

  } catch (error) {
    console.error('Error deleting Past Generation item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}