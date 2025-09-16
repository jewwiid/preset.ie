import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '../../../../lib/auth-utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Delete video API called')
    
    const { user, error: authError } = await getUserFromRequest(request)
    
    if (authError || !user) {
      console.log('❌ Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { videoUrl } = await request.json()
    
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      )
    }

    console.log('✅ User authenticated:', user.id)
    console.log('🎬 Removing video:', videoUrl)

    // First, try to delete from playground_gallery (saved videos)
    const { data: savedVideo, error: savedVideoError } = await supabaseAdmin
      .from('playground_gallery')
      .delete()
      .eq('user_id', user.id)
      .eq('video_url', videoUrl)
      .eq('media_type', 'video')
      .select()

    if (savedVideoError) {
      console.error('❌ Error removing saved video:', savedVideoError)
      throw savedVideoError
    }

    // If found in saved videos, return success
    if (savedVideo && savedVideo.length > 0) {
      console.log('✅ Successfully removed video from Saved Media:', savedVideo[0].id)
      console.log('ℹ️ Video remains in Past Generations for potential restoration')

      return NextResponse.json({
        success: true,
        message: 'Video removed from Saved Media successfully. It remains in Past Generations for potential restoration.',
        deletedCount: savedVideo.length,
        canRestore: true,
        source: 'gallery'
      })
    }

    // If not found in saved videos, try to delete from playground_video_generations
    console.log('🔍 Video not found in Saved Media, checking video generations...')
    
    const { data: generatedVideo, error: generatedVideoError } = await supabaseAdmin
      .from('playground_video_generations')
      .delete()
      .eq('user_id', user.id)
      .eq('video_url', videoUrl)
      .select()

    if (generatedVideoError) {
      console.error('❌ Error removing generated video:', generatedVideoError)
      throw generatedVideoError
    }

    if (!generatedVideo || generatedVideo.length === 0) {
      return NextResponse.json(
        { error: 'Video not found in any video list or already removed' },
        { status: 404 }
      )
    }

    console.log('✅ Successfully removed video from Generated Videos:', generatedVideo[0].id)

    return NextResponse.json({
      success: true,
      message: 'Video removed from Generated Videos successfully.',
      deletedCount: generatedVideo.length,
      canRestore: false,
      source: 'generations'
    })

  } catch (error) {
    console.error('❌ Error deleting video:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}
