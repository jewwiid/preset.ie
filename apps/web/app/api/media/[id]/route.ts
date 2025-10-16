import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// PUT /api/media/[id] - Update media metadata
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mediaId } = await context.params

    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Create two clients: one for user auth, one for admin operations
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user's token
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Parse request body
    const { title, description, tags } = await request.json()

    // Check if media exists and belongs to user
    const { data: existingMedia, error: fetchError } = await supabaseAdmin
      .from('playground_gallery')
      .select('*')
      .eq('id', mediaId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingMedia) {
      // Try user_media table
      const { data: userMedia, error: userMediaError } = await supabaseAdmin
        .from('user_media')
        .select('*')
        .eq('id', mediaId)
        .eq('user_id', user.id)
        .single()

      if (userMediaError || !userMedia) {
        return NextResponse.json(
          { success: false, error: 'Media not found' },
          { status: 404 }
        )
      }

      // Update in user_media table
      const updateData: any = {}
      if (title !== undefined) updateData.file_name = title
      if (description !== undefined) updateData.metadata = {
        ...userMedia.metadata,
        title,
        description,
        tags
      }

      const { data: updatedMedia, error: updateError } = await supabaseAdmin
        .from('user_media')
        .update(updateData)
        .eq('id', mediaId)
        .eq('user_id', user.id)
        .select()
        .maybeSingle()

      if (updateError) {
        console.error('Error updating user_media:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update media' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        media: {
          id: updatedMedia.id,
          title: title || userMedia.file_name,
          description,
          tags: tags || []
        }
      })
    }

    // Update in playground_gallery table
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (tags !== undefined) updateData.tags = tags

    const { data: updatedMedia, error: updateError } = await supabaseAdmin
      .from('playground_gallery')
      .update(updateData)
      .eq('id', mediaId)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('Error updating playground_gallery:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update media' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      media: {
        id: updatedMedia.id,
        title: updatedMedia.title,
        description: updatedMedia.description,
        tags: updatedMedia.tags
      }
    })

  } catch (error) {
    console.error('Error updating media:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/media/[id] - Delete media
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mediaId } = await context.params

    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Create two clients: one for user auth, one for admin operations
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user's token
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if media exists and belongs to user
    const { data: existingMedia, error: fetchError } = await supabaseAdmin
      .from('playground_gallery')
      .select('*')
      .eq('id', mediaId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingMedia) {
      // Try user_media table
      const { data: userMedia, error: userMediaError } = await supabaseAdmin
        .from('user_media')
        .select('*')
        .eq('id', mediaId)
        .eq('user_id', user.id)
        .single()

      if (userMediaError || !userMedia) {
        return NextResponse.json(
          { success: false, error: 'Media not found' },
          { status: 404 }
        )
      }

      // Delete from user_media table
      const { error: deleteError } = await supabaseAdmin
        .from('user_media')
        .delete()
        .eq('id', mediaId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error deleting from user_media:', deleteError)
        return NextResponse.json(
          { success: false, error: 'Failed to delete media' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Media deleted successfully'
      })
    }

    // Delete from playground_gallery table
    const { error: deleteError } = await supabaseAdmin
      .from('playground_gallery')
      .delete()
      .eq('id', mediaId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting from playground_gallery:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete media' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}